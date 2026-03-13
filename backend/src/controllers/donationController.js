import Donation from "../models/Donation.js";
import VolunteerAssignment from "../models/VolunteerAssignment.js";
import Delivery from "../models/Delivery.js";
import ImpactLog from "../models/ImpactLog.js";
import { calculateFreshnessScore, getFreshnessLabel } from "../utils/freshnessScore.js";
import { calculateImpact } from "../utils/impactCalculator.js";
import { findNearestNGOs } from "../utils/ngoMatcher.js";
import { sendResponse } from "../utils/sendResponse.js";
import AppError from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/donations   [donor]
// ─────────────────────────────────────────────────────────────────────────────
export const createDonation = catchAsync(async (req, res) => {
  const {
    foodName, foodCategory, quantity, description,
    pickupLocation, pickupWindowStart, pickupWindowEnd,
    expiryTime, imageUrl, tags,
  } = req.body;

  const freshnessScore = calculateFreshnessScore(expiryTime, foodCategory);
  const freshnessLabel = getFreshnessLabel(freshnessScore);

  // Auto-compute pickupWindowEnd = start + 3 hours if not supplied
  const windowEnd = pickupWindowEnd
    ? new Date(pickupWindowEnd)
    : new Date(new Date(pickupWindowStart).getTime() + 3 * 60 * 60 * 1000);

  // Ensure coordinates have a default if omitted
  const locationWithDefaults = {
    address: pickupLocation?.address ?? pickupLocation,
    coordinates: pickupLocation?.coordinates ?? { type: "Point", coordinates: [0, 0] },
  };

  const donation = await Donation.create({
    donorId: req.user._id,
    foodName,
    foodCategory,
    quantity,
    description,
    pickupLocation: locationWithDefaults,
    pickupWindowStart,
    pickupWindowEnd: windowEnd,
    expiryTime,
    freshnessScore,
    freshnessCalculatedAt: new Date(),
    imageUrl,
    tags,
  });

  // Suggest nearest NGOs based on pickup coordinates (non-blocking — swallows errors)
  let suggestedNgos = [];
  try {
    const coords = locationWithDefaults.coordinates?.coordinates ?? [0, 0];
    if (coords[0] !== 0 || coords[1] !== 0) {
      suggestedNgos = await findNearestNGOs(coords, 20);
    }
  } catch (_) { /* geo query failure should not break donation creation */ }

  return sendResponse(res, 201, true, "Donation created successfully", {
    donation,
    freshnessLabel,
    isUrgentPickup: freshnessScore < 30,
    suggestedNgos,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/donations   [all roles — filtered by role]
// ─────────────────────────────────────────────────────────────────────────────
export const getDonations = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 10 } = req.query;
  const filter = {};

  // Each role sees a different subset
  switch (req.user.role) {
    case "donor":
      filter.donorId = req.user._id;
      break;
    case "ngo":
      filter.status = "available";
      break;
    case "volunteer":
      filter.assignedVolunteer = req.user._id;
      break;
    // admin: no filter → sees everything
  }

  // Allow explicit status override (admin / donor "mine by status")
  if (status) filter.status = status;

  const skip = (Number(page) - 1) * Number(limit);

  const [donations, total] = await Promise.all([
    Donation.find(filter)
      .populate("donorId", "name email phone")
      .populate("assignedNgo", "name ngoProfile.ngoName phone")
      .populate("assignedVolunteer", "name phone")
      .sort({ freshnessScore: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Donation.countDocuments(filter),
  ]);

  // Refresh stale freshness scores in background (don't block response)
  donations.forEach(async (d) => {
    const fresh = calculateFreshnessScore(d.expiryTime, d.foodCategory);
    if (fresh !== d.freshnessScore) {
      d.freshnessScore = fresh;
      d.freshnessCalculatedAt = new Date();
      await d.save();
    }
  });

  // Annotate each donation with computed display fields
  const annotated = donations.map((d) => {
    const obj = d.toObject({ virtuals: true });
    obj.freshnessLabel  = getFreshnessLabel(d.freshnessScore);
    obj.isUrgentPickup  = d.freshnessScore < 30 && d.status === "available";
    return obj;
  });

  return sendResponse(res, 200, true, "Donations retrieved", {
    donations: annotated,
    pagination: {
      total,
      page:  Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/donations/:id
// ─────────────────────────────────────────────────────────────────────────────
export const getDonationById = catchAsync(async (req, res) => {
  const donation = await Donation.findById(req.params.id)
    .populate("donorId", "name email phone")
    .populate("assignedNgo", "name ngoProfile location phone")
    .populate("assignedVolunteer", "name phone");

  if (!donation) throw new AppError("Donation not found", 404);

  return sendResponse(res, 200, true, "Donation retrieved", { donation });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/donations/:id/cancel   [donor (own, available only) | admin]
// ─────────────────────────────────────────────────────────────────────────────
export const cancelDonation = catchAsync(async (req, res) => {
  const donation = await Donation.findById(req.params.id);
  if (!donation) throw new AppError("Donation not found", 404);

  if (req.user.role === "donor") {
    if (donation.donorId.toString() !== req.user._id.toString()) {
      throw new AppError("You can only cancel your own donations", 403);
    }
    if (donation.status !== "available") {
      throw new AppError("You can only cancel donations that are still available", 400);
    }
  }

  if (donation.status === "delivered") {
    throw new AppError("A delivered donation cannot be cancelled", 400);
  }

  donation.status = "cancelled";
  donation.statusHistory.push({
    status:    "cancelled",
    changedAt: new Date(),
    changedBy: req.user._id,
    note:      req.body.reason || "Cancelled by user",
  });
  await donation.save();
  await donation.populate("donorId", "name email phone");

  return sendResponse(res, 200, true, "Donation cancelled successfully", { donation });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/donations/:id/accept   [ngo]
// ─────────────────────────────────────────────────────────────────────────────
export const acceptDonation = catchAsync(async (req, res) => {
  const donation = await Donation.findById(req.params.id);
  if (!donation) throw new AppError("Donation not found", 404);

  if (donation.status !== "available") {
    throw new AppError(
      `This donation is no longer available (current status: ${donation.status})`,
      400
    );
  }

  donation.status      = "accepted";
  donation.assignedNgo = req.user._id;
  donation.statusHistory.push({
    status:    "accepted",
    changedAt: new Date(),
    changedBy: req.user._id,
  });
  await donation.save();
  await donation.populate("donorId", "name email phone");

  return sendResponse(res, 200, true, "Donation accepted successfully", { donation });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/donations/:id/assign   [ngo]
// ─────────────────────────────────────────────────────────────────────────────
export const assignVolunteer = catchAsync(async (req, res) => {
  const { volunteerId } = req.body;
  const donation = await Donation.findById(req.params.id);
  if (!donation) throw new AppError("Donation not found", 404);

  if (donation.status !== "accepted") {
    throw new AppError("Donation must be in 'accepted' state before assigning a volunteer", 400);
  }

  if (donation.assignedNgo.toString() !== req.user._id.toString()) {
    throw new AppError("Only the NGO that accepted this donation can assign a volunteer", 403);
  }

  // Create the assignment record
  const assignment = await VolunteerAssignment.create({
    donationId:  donation._id,
    volunteerId,
    assignedBy:  req.user._id,
  });

  // Link volunteer to the donation
  donation.assignedVolunteer = volunteerId;
  await donation.save();

  const populated = await assignment.populate([
    { path: "volunteerId", select: "name email phone" },
    { path: "donationId",  select: "foodName status"  },
  ]);

  return sendResponse(res, 201, true, "Volunteer assigned successfully", {
    assignment: populated,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/donations/:id/pickup   [volunteer]
// ─────────────────────────────────────────────────────────────────────────────
export const markPickup = catchAsync(async (req, res) => {
  const donation = await Donation.findById(req.params.id);
  if (!donation) throw new AppError("Donation not found", 404);

  if (donation.status !== "accepted") {
    throw new AppError(`Expected status 'accepted', got '${donation.status}'`, 400);
  }

  // Allow self-assignment: if no volunteer is assigned yet, this volunteer takes it
  if (donation.assignedVolunteer) {
    if (donation.assignedVolunteer.toString() !== req.user._id.toString()) {
      throw new AppError("You are not the assigned volunteer for this donation", 403);
    }
  } else {
    donation.assignedVolunteer = req.user._id;
  }

  // Find or auto-create the assignment record
  let assignment = await VolunteerAssignment.findOne({
    donationId:  donation._id,
    volunteerId: req.user._id,
    status:      { $in: ["pending", "accepted"] },
  });
  if (!assignment) {
    assignment = await VolunteerAssignment.create({
      donationId:  donation._id,
      volunteerId: req.user._id,
      assignedBy:  donation.assignedNgo || req.user._id,
    });
  }

  const pickedUpAt = new Date();

  // Update donation status
  donation.status = "pickedUp";
  donation.statusHistory.push({ status: "pickedUp", changedAt: pickedUpAt, changedBy: req.user._id });
  await donation.save();

  // Update assignment status
  assignment.status = "inProgress";
  await assignment.save();

  // Create delivery record
  const delivery = await Delivery.create({
    assignmentId:   assignment._id,
    donationId:     donation._id,
    volunteerId:    req.user._id,
    pickedUpAt,
    deliveryStatus: "pickedUp",
  });

  return sendResponse(res, 200, true, "Pickup confirmed", { donation, delivery });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/donations/:id/deliver   [volunteer]
// ─────────────────────────────────────────────────────────────────────────────
export const markDelivered = catchAsync(async (req, res) => {
  const { volunteerNotes, proofImageUrl } = req.body;

  const donation = await Donation.findById(req.params.id);
  if (!donation) throw new AppError("Donation not found", 404);

  if (donation.status !== "pickedUp") {
    throw new AppError(`Expected status 'pickedUp', got '${donation.status}'`, 400);
  }
  if (donation.assignedVolunteer?.toString() !== req.user._id.toString()) {
    throw new AppError("You are not the assigned volunteer for this donation", 403);
  }

  const deliveredAt = new Date();
  const impact = calculateImpact(donation.quantity.value, donation.quantity.unit);

  // ── Update donation ────────────────────────────────────────────────────────
  donation.status = "delivered";
  donation.statusHistory.push({ status: "delivered", changedAt: deliveredAt, changedBy: req.user._id });
  donation.environmentalImpact = { ...impact, calculatedAt: deliveredAt };
  await donation.save();

  // ── Update delivery record ─────────────────────────────────────────────────
  const delivery = await Delivery.findOne({ donationId: donation._id });
  if (!delivery) throw new AppError("Delivery record not found", 404);

  delivery.deliveredAt    = deliveredAt;
  delivery.deliveryStatus = "delivered";
  delivery.volunteerNotes = volunteerNotes;
  delivery.proofImageUrl  = proofImageUrl;
  delivery.impactSnapshot = impact;
  delivery.receivedBy     = donation.assignedNgo;
  await delivery.save();

  // ── Complete the assignment ────────────────────────────────────────────────
  await VolunteerAssignment.findOneAndUpdate(
    { donationId: donation._id, volunteerId: req.user._id },
    { status: "completed" }
  );

  // ── Write immutable impact log ─────────────────────────────────────────────
  const donationMonth = deliveredAt.toISOString().slice(0, 7); // "2024-07"
  await ImpactLog.create({
    donationId:       donation._id,
    deliveryId:       delivery._id,
    donorId:          donation.donorId,
    ngoId:            donation.assignedNgo,
    volunteerId:      req.user._id,
    quantityKg:       impact.quantityKg,
    mealsSaved:       impact.mealsSaved,
    co2OffsetKg:      impact.co2OffsetKg,
    waterSavedLitres: impact.waterSavedLitres,
    foodCategory:     donation.foodCategory,
    donationMonth,
    calculatedAt:     deliveredAt,
  });

  return sendResponse(res, 200, true, "Delivery confirmed. Great work! 🎉", {
    donation,
    delivery,
    impact,
  });
});

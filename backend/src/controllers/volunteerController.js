import VolunteerAssignment from "../models/VolunteerAssignment.js";
import Delivery from "../models/Delivery.js";
import Donation from "../models/Donation.js";
import { sendResponse } from "../utils/sendResponse.js";
import { catchAsync } from "../utils/catchAsync.js";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/volunteer/available   [volunteer]
// Accepted donations not yet assigned to any volunteer — volunteer can self-pick
// ─────────────────────────────────────────────────────────────────────────────
export const getAvailableDonations = catchAsync(async (req, res) => {
  const donations = await Donation.find({
    status: "accepted",
    $or: [{ assignedVolunteer: null }, { assignedVolunteer: { $exists: false } }],
  })
    .populate("donorId", "name phone")
    .populate("assignedNgo", "name ngoProfile.ngoName phone location")
    .sort({ createdAt: -1 });

  return sendResponse(res, 200, true, "Available donations retrieved", {
    donations,
    count: donations.length,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/volunteer/assignments   [volunteer]
// Active assignments: pending, accepted, inProgress
// ─────────────────────────────────────────────────────────────────────────────
export const getAssignments = catchAsync(async (req, res) => {
  const assignments = await VolunteerAssignment.find({
    volunteerId: req.user._id,
    status:      { $in: ["pending", "accepted", "inProgress"] },
  })
    .populate({
      path: "donationId",
      populate: [
        { path: "donorId",     select: "name phone" },
        { path: "assignedNgo", select: "name ngoProfile.ngoName phone location" },
      ],
    })
    .sort({ assignedAt: -1 });

  return sendResponse(res, 200, true, "Active assignments retrieved", {
    assignments,
    count: assignments.length,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/volunteer/history   [volunteer]
// Completed deliveries — shown in volunteer's history / impact section
// ─────────────────────────────────────────────────────────────────────────────
export const getDeliveryHistory = catchAsync(async (req, res) => {
  const deliveries = await Delivery.find({
    volunteerId:    req.user._id,
    deliveryStatus: "delivered",
  })
    .populate(
      "donationId",
      "foodName foodCategory quantity environmentalImpact createdAt"
    )
    .sort({ deliveredAt: -1 });

  // Aggregate personal impact stats
  const totalImpact = deliveries.reduce(
    (acc, d) => {
      acc.mealsSaved       += d.impactSnapshot?.mealsSaved       || 0;
      acc.co2OffsetKg      += d.impactSnapshot?.co2OffsetKg      || 0;
      acc.waterSavedLitres += d.impactSnapshot?.waterSavedLitres || 0;
      return acc;
    },
    { mealsSaved: 0, co2OffsetKg: 0, waterSavedLitres: 0 }
  );

  return sendResponse(res, 200, true, "Delivery history retrieved", {
    deliveries,
    count:       deliveries.length,
    totalImpact,
  });
});

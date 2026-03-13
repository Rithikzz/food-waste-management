import User from "../models/User.js";
import Donation from "../models/Donation.js";
import ImpactLog from "../models/ImpactLog.js";
import { sendResponse } from "../utils/sendResponse.js";
import AppError from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/stats   [admin]
// ─────────────────────────────────────────────────────────────────────────────
export const getStats = catchAsync(async (_req, res) => {
  const [donationCounts, impactTotals, userCounts, monthlyTrend, categoryBreakdown] =
    await Promise.all([

      // Donation counts grouped by status
      Donation.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),

      // Lifetime environmental impact totals
      ImpactLog.aggregate([
        {
          $group: {
            _id:              null,
            totalDeliveries:  { $sum: 1 },
            totalMealsSaved:  { $sum: "$mealsSaved" },
            totalCo2OffsetKg: { $sum: "$co2OffsetKg" },
            totalWaterSavedL: { $sum: "$waterSavedLitres" },
            totalQuantityKg:  { $sum: "$quantityKg" },
          },
        },
      ]),

      // User counts grouped by role
      User.aggregate([
        { $group: { _id: "$role", count: { $sum: 1 } } },
      ]),

      // Monthly delivery trend — last 6 months
      ImpactLog.aggregate([
        {
          $group: {
            _id:         "$donationMonth",
            deliveries:  { $sum: 1 },
            mealsSaved:  { $sum: "$mealsSaved" },
            co2OffsetKg: { $sum: "$co2OffsetKg" },
          },
        },
        { $sort:  { _id: -1 } },
        { $limit: 6 },
        { $sort:  { _id:  1 } }, // return oldest→newest for chart
      ]),

      // Food category breakdown (delivered donations only)
      ImpactLog.aggregate([
        {
          $group: {
            _id:          "$foodCategory",
            count:        { $sum: 1 },
            totalMeals:   { $sum: "$mealsSaved" },
            totalQuantity:{ $sum: "$quantityKg" },
          },
        },
        { $sort: { count: -1 } },
      ]),
    ]);

  // Flatten arrays into objects for easier frontend consumption
  const donations = donationCounts.reduce(
    (acc, i) => ({ ...acc, [i._id]: i.count }),
    { available: 0, accepted: 0, pickedUp: 0, delivered: 0, cancelled: 0 }
  );
  donations.total = Object.values(donations).reduce((a, b) => a + b, 0);

  const users = userCounts.reduce(
    (acc, i) => ({ ...acc, [i._id]: i.count }),
    { donor: 0, ngo: 0, volunteer: 0, admin: 0 }
  );
  users.total = Object.values(users).reduce((a, b) => a + b, 0);

  const impact = impactTotals[0] ?? {
    totalDeliveries: 0, totalMealsSaved: 0,
    totalCo2OffsetKg: 0, totalWaterSavedL: 0, totalQuantityKg: 0,
  };

  // ── Flat convenience fields for the admin dashboard cards ─────────────────
  const summary = {
    totalDonations:    donations.total,
    mealsDelivered:    impact.totalMealsSaved,
    activeVolunteers:  users.volunteer,
    ngoParticipating:  users.ngo,
    foodSavedKg:       +(impact.totalQuantityKg   ?? 0).toFixed(1),
    co2SavedKg:        +(impact.totalCo2OffsetKg  ?? 0).toFixed(1),
    waterSavedLitres:  Math.round(impact.totalWaterSavedL ?? 0),
    totalDeliveries:   impact.totalDeliveries,
    pendingDonations:  donations.available,
    cancelledDonations: donations.cancelled,
  };

  return sendResponse(res, 200, true, "Statistics retrieved", {
    ...summary,        // top-level flat fields (used by StatsCards)
    donations,         // status breakdown
    users,             // role breakdown
    impact,            // raw impact totals
    monthlyTrend,
    categoryBreakdown,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/users?role=donor&isActive=true&page=1&limit=20   [admin]
// ─────────────────────────────────────────────────────────────────────────────
export const getUsers = catchAsync(async (req, res) => {
  const { role, isActive, page = 1, limit = 20 } = req.query;
  const filter = {};
  if (role)              filter.role     = role;
  if (isActive !== undefined) filter.isActive = isActive === "true";

  const skip = (Number(page) - 1) * Number(limit);

  const [users, total] = await Promise.all([
    User.find(filter)
      .select("-password")
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 }),
    User.countDocuments(filter),
  ]);

  return sendResponse(res, 200, true, "Users retrieved", {
    users,
    pagination: {
      total,
      page:  Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/users/:id/toggle   [admin]
// ─────────────────────────────────────────────────────────────────────────────
export const toggleUserActive = catchAsync(async (req, res) => {
  const user = await User.findById(req.params.id).select("-password");
  if (!user) throw new AppError("User not found", 404);
  if (user.role === "admin") throw new AppError("Admin accounts cannot be deactivated", 403);

  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });

  const action = user.isActive ? "activated" : "deactivated";
  return sendResponse(res, 200, true, `User account ${action}`, { user });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/donations?status=available&page=1&limit=20   [admin]
// ─────────────────────────────────────────────────────────────────────────────
export const getAllDonations = catchAsync(async (req, res) => {
  const { status, page = 1, limit = 20 } = req.query;
  const filter = status ? { status } : {};
  const skip   = (Number(page) - 1) * Number(limit);

  const [donations, total] = await Promise.all([
    Donation.find(filter)
      .populate("donorId",           "name email")
      .populate("assignedNgo",        "name ngoProfile.ngoName")
      .populate("assignedVolunteer",  "name phone")
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 }),
    Donation.countDocuments(filter),
  ]);

  return sendResponse(res, 200, true, "All donations retrieved", {
    donations,
    pagination: {
      total,
      page:  Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / Number(limit)),
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/admin/donations/:id/cancel   [admin]
// ─────────────────────────────────────────────────────────────────────────────
export const forceCancelDonation = catchAsync(async (req, res) => {
  const donation = await Donation.findById(req.params.id);
  if (!donation) throw new AppError("Donation not found", 404);
  if (donation.status === "delivered") {
    throw new AppError("A completed delivery cannot be cancelled", 400);
  }

  donation.status = "cancelled";
  donation.statusHistory.push({
    status:    "cancelled",
    changedAt: new Date(),
    changedBy: req.user._id,
    note:      req.body.reason || "Force-cancelled by admin",
  });
  await donation.save();

  return sendResponse(res, 200, true, "Donation force-cancelled by admin", { donation });
});

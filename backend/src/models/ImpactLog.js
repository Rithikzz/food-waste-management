import mongoose from "mongoose";

/**
 * IMPACT LOG COLLECTION
 * ─────────────────────────────────────────────────────────
 * Immutable audit record created once per successful delivery.
 * Provides the raw data for admin analytics and the environmental
 * impact dashboard without running expensive aggregations on Donations.
 *
 * Relationships:
 *   donationId  → Donation._id
 *   deliveryId  → Delivery._id
 *   donorId     → User._id  (for per-donor impact reports)
 *   ngoId       → User._id  (for per-NGO impact reports)
 *
 * Admin /stats endpoint aggregates this collection with $group:
 *   - totalMealsSaved    = $sum mealsSaved
 *   - totalCo2OffsetKg   = $sum co2OffsetKg
 *   - totalWaterSavedL   = $sum waterSavedLitres
 *   - donationsPerDay    = $group by date(calculatedAt)
 *
 * Calculation formulas (from utils/impactCalculator.js):
 *   quantityKg        = donation.quantity.value (or converted to kg)
 *   mealsSaved        = quantityKg / 0.4       (400g avg per meal, WHO standard)
 *   co2OffsetKg       = quantityKg * 2.5       (avg CO2e per kg food waste, FAO data)
 *   waterSavedLitres  = quantityKg * 1000      (avg 1000L water per kg food, UNESCO data)
 */

const impactLogSchema = new mongoose.Schema(
  {
    donationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donation",
      required: true,
      unique: true,  // One impact record per donation; unique already creates an index
    },

    deliveryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Delivery",
      required: true,
      unique: true,
    },

    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    ngoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ── Impact Metrics ────────────────────────────────────────────────────
    quantityKg: {
      type: Number,
      required: true,
      min: 0,
    },

    mealsSaved: {
      type: Number,
      required: true,
      min: 0,
    },

    co2OffsetKg: {
      type: Number,
      required: true,
      min: 0,
    },

    waterSavedLitres: {
      type: Number,
      required: true,
      min: 0,
    },

    // ── Donation Context (denormalized for fast dashboard queries) ─────────
    foodCategory: {
      type: String,
    },

    donationMonth: {
      type: String, // "2024-07" — pre-computed for monthly grouping
    },

    calculatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    // This collection is append-only — no updates after creation
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
impactLogSchema.index({ calculatedAt: -1 });                     // admin timeline
impactLogSchema.index({ donorId: 1, calculatedAt: -1 });         // donor impact history
impactLogSchema.index({ ngoId: 1, calculatedAt: -1 });           // NGO impact history
impactLogSchema.index({ donationMonth: 1 });                     // monthly aggregation
impactLogSchema.index({ foodCategory: 1 });                      // category analytics

const ImpactLog = mongoose.model("ImpactLog", impactLogSchema);
export default ImpactLog;

/*
──────────────────────────────────────────────────────────────
EXAMPLE DOCUMENT
──────────────────────────────────────────────────────────────
{
  "_id": "64e5f6a7b8c9d0e1f2a3b4c5",
  "donationId":  "64b2e3f4a5c6d7e8f9a0b1c2",
  "deliveryId":  "64d4f5a6b7c8d9e0f1a2b3c4",
  "donorId":     "64a0e1d2c3b4a5f6e7d8c9b0",
  "ngoId":       "64a1f2c3d4e5f6a7b8c9d0e1",
  "volunteerId": "64a2e3f4b5c6d7a8b9c0d1e2",
  "quantityKg": 15,
  "mealsSaved": 37,
  "co2OffsetKg": 37.5,
  "waterSavedLitres": 15000,
  "foodCategory": "cooked",
  "donationMonth": "2024-07",
  "calculatedAt": "2024-07-05T15:10:00.000Z",
  "createdAt":    "2024-07-05T15:10:00.000Z"
}
──────────────────────────────────────────────────────────────

ADMIN STATS AGGREGATION QUERY EXAMPLE:
──────────────────────────────────────────────────────────────
db.impactlogs.aggregate([
  {
    $group: {
      _id: null,
      totalDonations:      { $sum: 1 },
      totalMealsSaved:     { $sum: "$mealsSaved" },
      totalCo2OffsetKg:    { $sum: "$co2OffsetKg" },
      totalWaterSavedL:    { $sum: "$waterSavedLitres" },
      totalQuantityKg:     { $sum: "$quantityKg" }
    }
  }
])
──────────────────────────────────────────────────────────────
*/

import mongoose from "mongoose";

/**
 * DONATION COLLECTION
 * ─────────────────────────────────────────────────────────
 * Core document of the system. Tracks a food item from creation
 * through its full lifecycle: available → accepted → pickedUp → delivered.
 *
 * freshnessScore (0–100):
 *   Calculated at creation and refreshed on read.
 *   Formula (in utils/freshnessScore.js):
 *     hoursRemaining = (expiryTime - now) / 3600000
 *     categoryWeight = CATEGORY_WEIGHTS[foodCategory]  (e.g. cooked=0.7, packaged=1.0)
 *     score = clamp((hoursRemaining / maxShelfHours) * categoryWeight * 100, 0, 100)
 *
 * pickupLocation uses GeoJSON Point so $geoNear queries find
 * the closest NGO to the pickup point (Phase 4B).
 *
 * environmentalImpact is populated by impactCalculator.js on delivery.
 */

const DONATION_STATUSES = ["available", "accepted", "pickedUp", "delivered", "cancelled"];

const FOOD_CATEGORIES = [
  "cooked",       // highest decay rate
  "raw",
  "bakery",
  "dairy",
  "packaged",     // lowest decay rate
  "beverages",
  "other",
];

const geoPointSchema = new mongoose.Schema(
  {
    type:        { type: String, enum: ["Point"], default: "Point" },
    coordinates: { type: [Number], required: true }, // [lng, lat]
  },
  { _id: false }
);

const donationSchema = new mongoose.Schema(
  {
    // ── Donor ──────────────────────────────────────────────────────────────
    donorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Donor ID is required"],
      index: true,
    },

    // ── Food Details ───────────────────────────────────────────────────────
    foodName: {
      type: String,
      required: [true, "Food name is required"],
      trim: true,
      maxlength: [150, "Food name cannot exceed 150 characters"],
    },

    foodCategory: {
      type: String,
      enum: {
        values: FOOD_CATEGORIES,
        message: `Food category must be one of: ${FOOD_CATEGORIES.join(", ")}`,
      },
      required: [true, "Food category is required"],
    },

    quantity: {
      value: {
        type: Number,
        required: [true, "Quantity value is required"],
        min: [0.1, "Quantity must be greater than 0"],
      },
      unit: {
        type: String,
        enum: ["kg", "litres", "portions", "boxes", "packets"],
        required: [true, "Quantity unit is required"],
      },
    },

    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },

    // ── Location & Timing ──────────────────────────────────────────────────
    pickupLocation: {
      address:     { type: String, required: [true, "Pickup address is required"], trim: true },
      // Coordinates optional — defaults to [0,0] when not provided (e.g. address-only form)
      coordinates: { type: geoPointSchema, required: false, default: () => ({ type: 'Point', coordinates: [0, 0] }) },
    },

    pickupWindowStart: {
      type: Date,
      required: [true, "Pickup start time is required"],
    },

    pickupWindowEnd: {
      type: Date,
      required: false, // Auto-computed as pickupWindowStart + 3h if omitted
      validate: {
        validator: function (v) { return v > this.pickupWindowStart; },
        message:   "Pickup window end must be after start",
      },
    },

    expiryTime: {
      type: Date,
      required: [true, "Expiry time is required"],
      validate: {
        validator: function (v) { return v > new Date(); },
        message:   "Expiry time must be in the future",
      },
    },

    // ── Freshness Score ────────────────────────────────────────────────────
    // Computed by utils/freshnessScore.js on creation and re-evaluated on read
    freshnessScore: {
      type: Number,
      min: 0,
      max: 100,
      default: 100,
    },

    freshnessCalculatedAt: {
      type: Date,
      default: Date.now,
    },

    // ── Status Lifecycle ───────────────────────────────────────────────────
    status: {
      type: String,
      enum: {
        values: DONATION_STATUSES,
        message: `Status must be one of: ${DONATION_STATUSES.join(", ")}`,
      },
      default: "available",
      index: true,
    },

    // Full status history for audit trail and analytics
    statusHistory: [
      {
        status:    { type: String, enum: DONATION_STATUSES },
        changedAt: { type: Date,   default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        note:      { type: String },
        _id: false,
      },
    ],

    // ── Assignments ────────────────────────────────────────────────────────
    assignedNgo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // User with role === 'ngo'
      default: null,
    },

    assignedVolunteer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // User with role === 'volunteer'
      default: null,
    },

    // ── Environmental Impact ───────────────────────────────────────────────
    // Populated by utils/impactCalculator.js when status → 'delivered'
    environmentalImpact: {
      mealsSaved:       { type: Number, default: 0 },
      co2OffsetKg:      { type: Number, default: 0 },
      waterSavedLitres: { type: Number, default: 0 },
      calculatedAt:     { type: Date },
      _id: false,
    },

    // ── Future / AI Metadata ───────────────────────────────────────────────
    // Reserved for ML tagging, image URLs, demand predictions, etc.
    imageUrl: {
      type: String,
      trim: true,
    },

    tags: {
      type: [String],
      default: [],
    },

    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: undefined,
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual: isExpired ──────────────────────────────────────────────────────
donationSchema.virtual("isExpired").get(function () {
  return this.expiryTime < new Date();
});

// ─── Virtual: hoursUntilExpiry ───────────────────────────────────────────────
donationSchema.virtual("hoursUntilExpiry").get(function () {
  return Math.max(0, (this.expiryTime - Date.now()) / 3_600_000);
});

// ─── Virtual: isUrgentPickup ─────────────────────────────────────────────────
// True when freshnessScore < 30 and donation is still actionable
donationSchema.virtual("isUrgentPickup").get(function () {
  return this.freshnessScore < 30 && this.status === "available";
});

// ─── Indexes ─────────────────────────────────────────────────────────────────
donationSchema.index({ "pickupLocation.coordinates": "2dsphere" }); // geo queries
donationSchema.index({ status: 1, freshnessScore: -1 });             // NGO browse list
donationSchema.index({ donorId: 1, status: 1 });                     // donor dashboard
donationSchema.index({ assignedNgo: 1, status: 1 });                 // NGO dashboard
donationSchema.index({ assignedVolunteer: 1, status: 1 });           // volunteer dashboard
donationSchema.index({ expiryTime: 1 });                             // expiry sweeper job
donationSchema.index({ createdAt: -1 });                             // admin recent list

// ─── Pre-save: push initial status history entry ─────────────────────────────
donationSchema.pre("save", function (next) {
  if (this.isNew) {
    this.statusHistory.push({ status: "available", changedAt: new Date() });
  }
  next();
});

const Donation = mongoose.model("Donation", donationSchema);
export default Donation;

/*
──────────────────────────────────────────────────────────────
EXAMPLE DOCUMENT
──────────────────────────────────────────────────────────────
{
  "_id": "64b2e3f4a5c6d7e8f9a0b1c2",
  "donorId": "64a0e1d2c3b4a5f6e7d8c9b0",
  "foodName": "Vegetable Biryani",
  "foodCategory": "cooked",
  "quantity": { "value": 15, "unit": "kg" },
  "description": "Freshly cooked vegetable biryani from event, no allergens",
  "pickupLocation": {
    "address": "12 Brigade Road, Bangalore, Karnataka 560001",
    "coordinates": {
      "type": "Point",
      "coordinates": [77.6066, 12.9719]
    }
  },
  "pickupWindowStart": "2024-07-05T14:00:00.000Z",
  "pickupWindowEnd":   "2024-07-05T17:00:00.000Z",
  "expiryTime":        "2024-07-05T20:00:00.000Z",
  "freshnessScore": 82,
  "freshnessCalculatedAt": "2024-07-05T13:00:00.000Z",
  "status": "accepted",
  "statusHistory": [
    { "status": "available", "changedAt": "2024-07-05T13:00:00.000Z" },
    { "status": "accepted",  "changedAt": "2024-07-05T13:45:00.000Z", "changedBy": "64a1f2c3..." }
  ],
  "assignedNgo": "64a1f2c3d4e5f6a7b8c9d0e1",
  "assignedVolunteer": null,
  "environmentalImpact": {
    "mealsSaved": 37,
    "co2OffsetKg": 37.5,
    "waterSavedLitres": 15000,
    "calculatedAt": null
  },
  "imageUrl": "https://cdn.example.com/donations/biryani-001.jpg",
  "tags": ["vegetarian", "event-surplus"],
  "createdAt": "2024-07-05T13:00:00.000Z",
  "updatedAt": "2024-07-05T13:45:00.000Z"
}
──────────────────────────────────────────────────────────────
*/

import mongoose from "mongoose";

/**
 * DELIVERY COLLECTION
 * ─────────────────────────────────────────────────────────
 * Created when a volunteer marks food as picked up.
 * Serves as the official delivery record and proof of completion.
 *
 * Relationships:
 *   assignmentId → VolunteerAssignment._id
 *   donationId   → Donation._id
 *   volunteerId  → User._id (role: 'volunteer')
 *   receivedBy   → User._id (role: 'ngo')
 *
 * On creation:  Donation.status  → 'pickedUp'
 * On delivery:  Donation.status  → 'delivered'
 *               VolunteerAssignment.status → 'completed'
 *               Donation.environmentalImpact populated
 */

const DELIVERY_STATUSES = [
  "pickedUp",    // Volunteer has the food, en route to NGO
  "delivered",   // Food handed to NGO
  "failed",      // Delivery could not be completed (food spoiled, NGO closed, etc.)
];

const deliverySchema = new mongoose.Schema(
  {
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VolunteerAssignment",
      required: [true, "Assignment ID is required"],
      index: true,
    },

    donationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donation",
      required: [true, "Donation ID is required"],
      // unique index defined below
    },

    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Volunteer ID is required"],
      index: true,
    },

    // NGO user who received the food (confirms delivery on their end)
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    // ── Timestamps ────────────────────────────────────────────────────────
    pickedUpAt: {
      type: Date,
      required: [true, "Pickup time is required"],
    },

    deliveredAt: {
      type: Date,
      validate: {
        validator: function (v) {
          return !v || v >= this.pickedUpAt;
        },
        message: "Delivery time must be after pickup time",
      },
    },

    // ── Status ────────────────────────────────────────────────────────────
    deliveryStatus: {
      type: String,
      enum: {
        values: DELIVERY_STATUSES,
        message: `Delivery status must be one of: ${DELIVERY_STATUSES.join(", ")}`,
      },
      default: "pickedUp",
      index: true,
    },

    // ── Proof & Notes ─────────────────────────────────────────────────────
    // URL to uploaded delivery proof photo (Phase 10 enhancement)
    proofImageUrl: {
      type: String,
      trim: true,
    },

    volunteerNotes: {
      type: String,
      trim: true,
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },

    // Reason for failure if deliveryStatus === 'failed'
    failureReason: {
      type: String,
      trim: true,
      maxlength: [300, "Failure reason cannot exceed 300 characters"],
    },

    // ── Environmental Impact Snapshot ─────────────────────────────────────
    // Denormalized copy from Donation.environmentalImpact for fast analytics
    // Populated by utils/impactCalculator.js when deliveryStatus → 'delivered'
    impactSnapshot: {
      mealsSaved:       { type: Number, default: 0 },
      co2OffsetKg:      { type: Number, default: 0 },
      waterSavedLitres: { type: Number, default: 0 },
      _id: false,
    },

    // ── Delivery Duration (minutes) ───────────────────────────────────────
    // Virtual is cleaner but storing it enables aggregation queries in admin stats
    durationMinutes: {
      type: Number,
    },
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Virtual: total delivery time ────────────────────────────────────────────
deliverySchema.virtual("deliveryDuration").get(function () {
  if (!this.deliveredAt || !this.pickedUpAt) return null;
  return Math.round((this.deliveredAt - this.pickedUpAt) / 60_000); // minutes
});

// ─── Indexes ──────────────────────────────────────────────────────────────────
deliverySchema.index({ volunteerId: 1, deliveryStatus: 1 });      // volunteer history
deliverySchema.index({ donationId: 1 }, { unique: true });         // one delivery per donation
deliverySchema.index({ deliveryStatus: 1, deliveredAt: -1 });      // admin analytics
deliverySchema.index({ createdAt: -1 });                           // recent deliveries

// ─── Pre-save: auto-calculate duration ───────────────────────────────────────
deliverySchema.pre("save", function (next) {
  if (this.deliveredAt && this.pickedUpAt) {
    this.durationMinutes = Math.round((this.deliveredAt - this.pickedUpAt) / 60_000);
  }
  next();
});

const Delivery = mongoose.model("Delivery", deliverySchema);
export default Delivery;

/*
──────────────────────────────────────────────────────────────
EXAMPLE DOCUMENT
──────────────────────────────────────────────────────────────
{
  "_id": "64d4f5a6b7c8d9e0f1a2b3c4",
  "assignmentId": "64c3f4a5b6c7d8e9f0a1b2c3",
  "donationId":   "64b2e3f4a5c6d7e8f9a0b1c2",
  "volunteerId":  "64a2e3f4b5c6d7a8b9c0d1e2",
  "receivedBy":   "64a1f2c3d4e5f6a7b8c9d0e1",
  "pickedUpAt":   "2024-07-05T14:30:00.000Z",
  "deliveredAt":  "2024-07-05T15:10:00.000Z",
  "deliveryStatus": "delivered",
  "proofImageUrl": "https://cdn.example.com/deliveries/proof-001.jpg",
  "volunteerNotes": "Delivered all 15kg. NGO staff confirmed receipt.",
  "failureReason": null,
  "impactSnapshot": {
    "mealsSaved": 37,
    "co2OffsetKg": 37.5,
    "waterSavedLitres": 15000
  },
  "durationMinutes": 40,
  "createdAt": "2024-07-05T14:30:00.000Z",
  "updatedAt": "2024-07-05T15:10:00.000Z"
}
──────────────────────────────────────────────────────────────
*/

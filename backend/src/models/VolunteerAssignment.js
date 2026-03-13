import mongoose from "mongoose";

/**
 * VOLUNTEER ASSIGNMENT COLLECTION
 * ─────────────────────────────────────────────────────────
 * Created when an NGO assigns a volunteer to a donation.
 * Tracks the volunteer's response and progress through pickup.
 *
 * Relationships:
 *   donationId  → Donation._id   (one-to-one per active donation)
 *   volunteerId → User._id       (role: 'volunteer')
 *   assignedBy  → User._id       (role: 'ngo' or 'admin')
 *
 * Status lifecycle:
 *   pending → accepted → inProgress → completed → cancelled
 *   (volunteer can reject → re-assign to another volunteer)
 */

const ASSIGNMENT_STATUSES = [
  "pending",     // NGO assigned, volunteer not yet acknowledged
  "accepted",    // Volunteer confirmed they'll do it
  "inProgress",  // Volunteer en route to pickup
  "completed",   // Volunteer delivered (triggers Delivery doc creation)
  "rejected",    // Volunteer declined (NGO must re-assign)
  "cancelled",   // Cancelled by NGO or admin
];

const volunteerAssignmentSchema = new mongoose.Schema(
  {
    donationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donation",
      required: [true, "Donation ID is required"],
      // index defined below with partial filter (unique for active assignments only)
    },

    volunteerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Volunteer ID is required"],
      index: true,
    },

    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // NGO or admin who made the assignment
      required: [true, "Assigned-by user ID is required"],
    },

    assignedAt: {
      type: Date,
      default: Date.now,
    },

    // When the volunteer responded (accepted or rejected)
    respondedAt: {
      type: Date,
    },

    status: {
      type: String,
      enum: {
        values: ASSIGNMENT_STATUSES,
        message: `Status must be one of: ${ASSIGNMENT_STATUSES.join(", ")}`,
      },
      default: "pending",
      index: true,
    },

    // Optional notes from volunteer (e.g. "will be 10 mins late")
    volunteerNote: {
      type: String,
      trim: true,
      maxlength: [300, "Note cannot exceed 300 characters"],
    },

    // Estimated arrival time at pickup (volunteer can set this)
    estimatedPickupAt: {
      type: Date,
    },

    // Full history for audit trail
    statusHistory: [
      {
        status:    { type: String, enum: ASSIGNMENT_STATUSES },
        changedAt: { type: Date, default: Date.now },
        note:      { type: String },
        _id: false,
      },
    ],
  },
  {
    timestamps: true,
    toJSON:   { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ──────────────────────────────────────────────────────────────────
volunteerAssignmentSchema.index({ volunteerId: 1, status: 1 });   // volunteer dashboard
volunteerAssignmentSchema.index({ donationId: 1, status: 1 });    // NGO lookup
volunteerAssignmentSchema.index({ assignedBy: 1 });               // NGO's assigned list
volunteerAssignmentSchema.index({ createdAt: -1 });               // admin recent list

// Prevent duplicate active assignments for the same donation
volunteerAssignmentSchema.index(
  { donationId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ["pending", "accepted", "inProgress"] },
    },
  }
);

// ─── Pre-save: track status history ──────────────────────────────────────────
volunteerAssignmentSchema.pre("save", function (next) {
  if (this.isNew) {
    this.statusHistory.push({ status: "pending", changedAt: new Date() });
  } else if (this.isModified("status")) {
    this.statusHistory.push({ status: this.status, changedAt: new Date() });
    if (["accepted", "rejected"].includes(this.status)) {
      this.respondedAt = new Date();
    }
  }
  next();
});

const VolunteerAssignment = mongoose.model("VolunteerAssignment", volunteerAssignmentSchema);
export default VolunteerAssignment;

/*
──────────────────────────────────────────────────────────────
EXAMPLE DOCUMENT
──────────────────────────────────────────────────────────────
{
  "_id": "64c3f4a5b6c7d8e9f0a1b2c3",
  "donationId":  "64b2e3f4a5c6d7e8f9a0b1c2",
  "volunteerId": "64a2e3f4b5c6d7a8b9c0d1e2",
  "assignedBy":  "64a1f2c3d4e5f6a7b8c9d0e1",
  "assignedAt":  "2024-07-05T14:00:00.000Z",
  "respondedAt": "2024-07-05T14:05:00.000Z",
  "status": "accepted",
  "volunteerNote": "On my way, ETA 20 minutes",
  "estimatedPickupAt": "2024-07-05T14:25:00.000Z",
  "statusHistory": [
    { "status": "pending",  "changedAt": "2024-07-05T14:00:00.000Z" },
    { "status": "accepted", "changedAt": "2024-07-05T14:05:00.000Z" }
  ],
  "createdAt": "2024-07-05T14:00:00.000Z",
  "updatedAt": "2024-07-05T14:05:00.000Z"
}
──────────────────────────────────────────────────────────────
*/

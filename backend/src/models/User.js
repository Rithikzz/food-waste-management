import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/**
 * USER COLLECTION
 * ─────────────────────────────────────────────────────────
 * Central identity document for all four roles.
 * Role drives access control (RBAC) throughout the system.
 *
 * NGO-specific fields (ngoProfile) are populated only when role === 'ngo'.
 * This avoids a separate auth collection while keeping the schema clean.
 *
 * location uses GeoJSON Point format so MongoDB $nearSphere / $geoNear
 * queries work natively for smart NGO matching (Phase 4B).
 */

const locationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Point"],
      default: "Point",
    },
    coordinates: {
      // GeoJSON format: [longitude, latitude]  ← NOTE: lng first, then lat
      type: [Number],
      required: [true, "Coordinates [lng, lat] are required"],
      validate: {
        validator: (v) =>
          v.length === 2 &&
          v[0] >= -180 && v[0] <= 180 &&   // longitude
          v[1] >= -90  && v[1] <= 90,       // latitude
        message: "Coordinates must be [longitude, latitude] within valid range",
      },
    },
  },
  { _id: false }
);

const ngoProfileSchema = new mongoose.Schema(
  {
    ngoName:       { type: String,  trim: true },
    contactNumber: { type: String,  trim: true },
    // Maximum kg of food the NGO can handle per day
    capacityKgPerDay: { type: Number, min: 0 },
    // Address string for display; coordinates stored in parent location field
    address:       { type: String,  trim: true },
    isVerified:    { type: Boolean, default: false },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,  // unique already creates an index; no need for explicit index
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Never returned in queries by default
    },

    role: {
      type: String,
      enum: {
        values: ["donor", "ngo", "volunteer", "admin"],
        message: "Role must be one of: donor, ngo, volunteer, admin",
      },
      required: [true, "Role is required"],
    },

    phone: {
      type: String,
      trim: true,
      match: [/^\+?[0-9]{7,15}$/, "Please provide a valid phone number"],
    },

    // GeoJSON Point — required for $geoNear NGO matching queries
    location: {
      type: locationSchema,
      required: [true, "Location coordinates are required"],
    },

    // Only populated when role === 'ngo'
    ngoProfile: {
      type: ngoProfileSchema,
      default: undefined,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    // Tracks when the user last logged in (useful for admin analytics)
    lastLoginAt: {
      type: Date,
    },

    // Reserved for future AI/ML features (e.g., donation frequency tags)
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
      default: undefined,
    },
  },
  {
    timestamps: true, // adds createdAt, updatedAt automatically
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// ─── Indexes ────────────────────────────────────────────────────────────────
// 2dsphere index enables $nearSphere, $geoWithin, $geoNear on location field
userSchema.index({ location: "2dsphere" });
userSchema.index({ role: 1 });
// Note: email unique index is already created by the schema field definition
userSchema.index({ role: 1, isActive: 1 }); // admin: filter active NGOs/volunteers

// ─── Pre-save hook: hash password before storing ─────────────────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// ─── Instance method: compare passwords ─────────────────────────────────────
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);
export default User;

/*
──────────────────────────────────────────────────────────────
EXAMPLE DOCUMENT (NGO user)
──────────────────────────────────────────────────────────────
{
  "_id": "64a1f2c3d4e5f6a7b8c9d0e1",
  "name": "Green Earth NGO",
  "email": "contact@greenearth.org",
  "password": "$2b$12$...",           ← bcrypt hash, never returned
  "role": "ngo",
  "phone": "+919876543210",
  "location": {
    "type": "Point",
    "coordinates": [77.5946, 12.9716]  ← [lng, lat] — Bangalore
  },
  "ngoProfile": {
    "ngoName": "Green Earth NGO",
    "contactNumber": "+919876543210",
    "capacityKgPerDay": 200,
    "address": "14 MG Road, Bangalore, Karnataka",
    "isVerified": true
  },
  "isActive": true,
  "lastLoginAt": "2024-07-03T08:30:00.000Z",
  "createdAt": "2024-06-01T10:00:00.000Z",
  "updatedAt": "2024-07-03T08:30:00.000Z"
}
──────────────────────────────────────────────────────────────
*/

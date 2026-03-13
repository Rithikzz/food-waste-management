// ── Roles ──────────────────────────────────────────────────────────────────────
export const ROLES = Object.freeze({
  DONOR:     "donor",
  NGO:       "ngo",
  VOLUNTEER: "volunteer",
  ADMIN:     "admin",
});

// ── Donation status lifecycle ──────────────────────────────────────────────────
export const DONATION_STATUSES = Object.freeze({
  AVAILABLE:  "available",
  ACCEPTED:   "accepted",
  PICKED_UP:  "pickedUp",
  DELIVERED:  "delivered",
  CANCELLED:  "cancelled",
});

// ── Food categories ────────────────────────────────────────────────────────────
export const FOOD_CATEGORIES = Object.freeze([
  "cooked",
  "raw",
  "bakery",
  "dairy",
  "packaged",
  "beverages",
  "other",
]);

// ── Quantity units ─────────────────────────────────────────────────────────────
export const QUANTITY_UNITS = Object.freeze([
  "kg",
  "litres",
  "portions",
  "boxes",
  "packets",
]);

// ── Assignment statuses ────────────────────────────────────────────────────────
export const ASSIGNMENT_STATUSES = Object.freeze({
  PENDING:     "pending",
  ACCEPTED:    "accepted",
  IN_PROGRESS: "inProgress",
  COMPLETED:   "completed",
  REJECTED:    "rejected",
  CANCELLED:   "cancelled",
});

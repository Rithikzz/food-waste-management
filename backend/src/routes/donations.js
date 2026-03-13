import { Router } from "express";
import { body } from "express-validator";
import {
  createDonation,
  getDonations,
  getDonationById,
  cancelDonation,
  acceptDonation,
  assignVolunteer,
  markPickup,
  markDelivered,
} from "../controllers/donationController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";
import { validateRequest } from "../middleware/validateRequest.js";

const router = Router();

// All donation routes require authentication
router.use(protect);

// GET /api/donations        — list (role-filtered)
// POST /api/donations       — create (donor only)
router
  .route("/")
  .get(getDonations)
  .post(
    authorize("donor"),
    [
      body("foodName").trim().notEmpty().withMessage("Food name is required"),
      body("foodCategory").notEmpty().withMessage("Food category is required"),
      body("quantity.value").isNumeric().withMessage("Quantity value must be a number"),
      body("quantity.unit").notEmpty().withMessage("Quantity unit is required"),
      body("pickupLocation.address").notEmpty().withMessage("Pickup address is required"),
      body("pickupWindowStart").isISO8601().withMessage("pickupWindowStart must be a valid datetime"),
      // pickupWindowEnd is optional — controller auto-computes it as pickupWindowStart + 3h
      body("pickupWindowEnd").optional().isISO8601().withMessage("pickupWindowEnd must be a valid datetime"),
      body("expiryTime").isISO8601().withMessage("expiryTime must be a valid datetime"),
    ],
    validateRequest,
    createDonation
  );

// GET /api/donations/:id
router.get("/:id", getDonationById);

// PATCH /api/donations/:id/cancel  — donor (own) or admin
router.patch("/:id/cancel", authorize("donor", "admin"), cancelDonation);

// PATCH /api/donations/:id/accept  — ngo only
router.patch("/:id/accept", authorize("ngo"), acceptDonation);

// POST /api/donations/:id/assign   — ngo assigns a volunteer
router.post(
  "/:id/assign",
  authorize("ngo"),
  [body("volunteerId").notEmpty().withMessage("volunteerId is required")],
  validateRequest,
  assignVolunteer
);

// PATCH /api/donations/:id/pickup   — volunteer confirms pickup
router.patch("/:id/pickup", authorize("volunteer"), markPickup);

// PATCH /api/donations/:id/deliver  — volunteer confirms delivery
router.patch("/:id/deliver", authorize("volunteer"), markDelivered);

export default router;

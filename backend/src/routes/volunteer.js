import { Router } from "express";
import { getAssignments, getDeliveryHistory, getAvailableDonations } from "../controllers/volunteerController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = Router();

// All volunteer routes: authenticated volunteers only
router.use(protect, authorize("volunteer"));

// GET /api/volunteer/available    — accepted donations open for self-assignment
router.get("/available", getAvailableDonations);

// GET /api/volunteer/assignments  — active assignments
router.get("/assignments", getAssignments);

// GET /api/volunteer/history      — completed deliveries + personal impact stats
router.get("/history", getDeliveryHistory);

export default router;

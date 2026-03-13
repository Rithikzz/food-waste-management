import { Router } from "express";
import { getNGOs, getNearestNGOs, getVolunteers } from "../controllers/ngoController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = Router();

// All NGO routes require authentication
router.use(protect);

// GET /api/ngos/volunteers    — list active volunteers (for NGO assignment modal)
router.get("/volunteers", authorize("ngo", "admin"), getVolunteers);

// GET /api/ngos               — list all active NGOs
router.get("/", getNGOs);

// GET /api/ngos/nearest?lng=&lat=&maxDistance=  — geo-sorted NGOs
router.get("/nearest", getNearestNGOs);

export default router;

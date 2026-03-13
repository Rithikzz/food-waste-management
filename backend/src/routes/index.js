import { Router } from "express";
import authRoutes from "./auth.js";
import donationRoutes from "./donations.js";
import volunteerRoutes from "./volunteer.js";
import ngoRoutes from "./ngos.js";
import adminRoutes from "./admin.js";

const router = Router();

router.use("/auth",      authRoutes);
router.use("/donations", donationRoutes);
router.use("/volunteer", volunteerRoutes);
router.use("/ngos",      ngoRoutes);
router.use("/admin",     adminRoutes);

export default router;

import { Router } from "express";
import {
  getStats,
  getUsers,
  toggleUserActive,
  getAllDonations,
  forceCancelDonation,
} from "../controllers/adminController.js";
import { protect } from "../middleware/authMiddleware.js";
import { authorize } from "../middleware/roleMiddleware.js";

const router = Router();

// All admin routes: authenticated admins only
router.use(protect, authorize("admin"));

// GET /api/admin/stats                        — aggregated platform statistics
router.get("/stats", getStats);

// GET /api/admin/users?role=&isActive=        — paginated user list
router.get("/users", getUsers);

// PATCH /api/admin/users/:id/toggle           — activate / deactivate user
router.patch("/users/:id/toggle", toggleUserActive);

// GET /api/admin/donations?status=            — all donations (paginated)
router.get("/donations", getAllDonations);

// PATCH /api/admin/donations/:id/cancel       — force-cancel any donation
router.patch("/donations/:id/cancel", forceCancelDonation);

export default router;

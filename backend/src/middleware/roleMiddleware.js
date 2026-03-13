import AppError from "../utils/AppError.js";

/**
 * authorize(...roles) — role-based access control gate.
 *
 * Usage (in routes):
 *   router.post("/", protect, authorize("donor"), createDonation)
 *   router.get("/stats", protect, authorize("admin"), getStats)
 *   router.patch("/:id/cancel", protect, authorize("donor", "admin"), cancelDonation)
 */
export const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new AppError(
          `Access denied. This action requires role: ${roles.join(" or ")}`,
          403
        )
      );
    }
    next();
  };

import jwt from "jsonwebtoken";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";

/**
 * protect — verifies JWT and attaches the authenticated user to req.user.
 * Every protected route uses this as the first middleware.
 *
 * Expects: Authorization: Bearer <token>
 */
export const protect = catchAsync(async (req, _res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new AppError("No authentication token provided", 401);
  }

  const token = authHeader.split(" ")[1];

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AppError("Invalid or expired token. Please log in again", 401);
  }

  const user = await User.findById(decoded.id).select("-password");
  if (!user) throw new AppError("The user belonging to this token no longer exists", 401);
  if (!user.isActive) throw new AppError("Your account has been deactivated. Contact support", 403);

  req.user = user; // full Mongoose doc available downstream
  next();
});

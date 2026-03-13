import User from "../models/User.js";
import { generateToken } from "../utils/generateToken.js";
import { sendResponse } from "../utils/sendResponse.js";
import AppError from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
export const register = catchAsync(async (req, res) => {
  const { name, email, password, role, phone, location, ngoProfile } = req.body;

  const existing = await User.findOne({ email });
  if (existing) throw new AppError("An account with this email already exists", 400);

  const user = await User.create({
    name,
    email,
    password,
    role,
    phone,
    location,
    // ngoProfile is only attached when role === 'ngo'
    ...(role === "ngo" && ngoProfile ? { ngoProfile } : {}),
  });

  const token = generateToken({ id: user._id, role: user.role });

  return sendResponse(res, 201, true, "Registration successful", {
    token,
    user: {
      _id:   user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
export const login = catchAsync(async (req, res) => {
  const { email, password } = req.body;

  // select("+password") overrides the schema's select:false
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(password))) {
    throw new AppError("Invalid email or password", 401);
  }

  if (!user.isActive) {
    throw new AppError("Your account has been deactivated. Please contact support", 403);
  }

  // Record last login (skip full validation to avoid unnecessary overhead)
  user.lastLoginAt = new Date();
  await user.save({ validateBeforeSave: false });

  const token = generateToken({ id: user._id, role: user.role });

  return sendResponse(res, 200, true, "Login successful", {
    token,
    user: {
      _id:   user._id,
      name:  user.name,
      email: user.email,
      role:  user.role,
    },
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/auth/me  (protected)
// ─────────────────────────────────────────────────────────────────────────────
export const getMe = catchAsync(async (req, res) => {
  // req.user is already populated by authMiddleware (without password)
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError("User not found", 404);

  return sendResponse(res, 200, true, "Profile retrieved", { user });
});

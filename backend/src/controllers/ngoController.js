import User from "../models/User.js";
import { findNearestNGOs } from "../utils/ngoMatcher.js";
import { sendResponse } from "../utils/sendResponse.js";
import AppError from "../utils/AppError.js";
import { catchAsync } from "../utils/catchAsync.js";

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ngos/volunteers   [ngo | admin]
// Returns all active volunteers — used by NGOs when assigning a volunteer.
// ─────────────────────────────────────────────────────────────────────────────
export const getVolunteers = catchAsync(async (_req, res) => {
  const volunteers = await User.find({ role: "volunteer", isActive: true })
    .select("name email phone createdAt")
    .sort({ name: 1 });

  return sendResponse(res, 200, true, "Volunteers retrieved", {
    volunteers,
    count: volunteers.length,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ngos   [all authenticated users]
// Returns all active NGOs — used in the volunteer assignment modal and admin UI.
// ─────────────────────────────────────────────────────────────────────────────
export const getNGOs = catchAsync(async (_req, res) => {
  const ngos = await User.find({ role: "ngo", isActive: true })
    .select("name email phone ngoProfile location createdAt")
    .sort({ "ngoProfile.ngoName": 1 });

  return sendResponse(res, 200, true, "NGOs retrieved", {
    ngos,
    count: ngos.length,
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/ngos/nearest?lng=77.5946&lat=12.9716&maxDistance=20
// Returns NGOs sorted by distance ASC using MongoDB $geoNear (2dsphere index).
// Used by the system to suggest the best NGO after a donation is posted.
// ─────────────────────────────────────────────────────────────────────────────
export const getNearestNGOs = catchAsync(async (req, res) => {
  const { lng, lat, maxDistance = 20 } = req.query;

  if (!lng || !lat) {
    throw new AppError(
      "Query parameters 'lng' (longitude) and 'lat' (latitude) are required",
      400
    );
  }

  const parsedLng = parseFloat(lng);
  const parsedLat = parseFloat(lat);

  if (isNaN(parsedLng) || isNaN(parsedLat)) {
    throw new AppError("lng and lat must be valid numbers", 400);
  }
  if (parsedLng < -180 || parsedLng > 180) throw new AppError("lng must be between -180 and 180", 400);
  if (parsedLat < -90  || parsedLat > 90)  throw new AppError("lat must be between -90 and 90", 400);

  const ngos = await findNearestNGOs(
    [parsedLng, parsedLat],
    parseFloat(maxDistance)
  );

  return sendResponse(res, 200, true, "Nearest NGOs retrieved", {
    ngos,
    count: ngos.length,
    searchRadius: `${maxDistance}km`,
  });
});

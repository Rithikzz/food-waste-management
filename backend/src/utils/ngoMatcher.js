/**
 * SMART NGO MATCHER
 * ─────────────────────────────────────────────────────────────────────────────
 * Uses MongoDB's $geoNear aggregation stage (backed by the 2dsphere index on
 * User.location) to find active NGOs within a radius of the pickup point,
 * sorted by distance ascending.
 *
 * Coordinates format: GeoJSON — [longitude, latitude]
 *
 * Usage:
 *   const ngos = await findNearestNGOs([77.5946, 12.9716], 20);
 */

import User from "../models/User.js";

/**
 * @param {[number, number]} pickupCoordinates  [longitude, latitude]
 * @param {number}           maxDistanceKm      Search radius (default 20km)
 * @returns {Promise<Array>}                    NGOs sorted by distance ASC
 */
export const findNearestNGOs = async (pickupCoordinates, maxDistanceKm = 20) => {
  const ngos = await User.aggregate([
    {
      $geoNear: {
        near: {
          type: "Point",
          coordinates: pickupCoordinates, // [lng, lat]
        },
        distanceField: "distanceMetres",
        maxDistance: maxDistanceKm * 1000, // convert km → metres
        spherical: true,
        query: { role: "ngo", isActive: true },
      },
    },
    {
      // Convert metres to km and round to 2 decimal places
      $addFields: {
        distanceKm: { $round: [{ $divide: ["$distanceMetres", 1000] }, 2] },
      },
    },
    {
      $project: {
        name: 1,
        email: 1,
        phone: 1,
        ngoProfile: 1,
        location: 1,
        distanceKm: 1,
        distanceMetres: 1,
      },
    },
    { $limit: 10 }, // return top 10 nearest NGOs
  ]);

  return ngos;
};

/**
 * Haversine distance formula — pure JS fallback (no DB required).
 * Useful for calculating distance between any two coordinate pairs.
 *
 * @param {[number, number]} coords1  [lng, lat]
 * @param {[number, number]} coords2  [lng, lat]
 * @returns {number}                  Distance in kilometres
 */
export const haversineDistance = (coords1, coords2) => {
  const [lng1, lat1] = coords1;
  const [lng2, lat2] = coords2;
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

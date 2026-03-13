import jwt from "jsonwebtoken";

/**
 * Signs a JWT with the given payload.
 * Secret and expiry are read from environment variables.
 */
export const generateToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

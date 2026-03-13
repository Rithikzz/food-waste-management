import { validationResult } from "express-validator";

/**
 * validateRequest — reads express-validator errors from the request object.
 * Must be placed AFTER the validation chain in the route definition.
 *
 * On failure returns:
 * {
 *   "success": false,
 *   "message": "Validation failed",
 *   "errors": [{ "field": "email", "message": "Valid email is required" }]
 * }
 */
export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

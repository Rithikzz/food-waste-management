/**
 * Standardised API response shape used across all controllers.
 *
 * Success:  { success: true,  message: "...", data: { ... } }
 * Failure:  { success: false, message: "..." }           ← from errorMiddleware
 */
export const sendResponse = (res, statusCode, success, message, data = null) => {
  const body = { success, message };
  if (data !== null) body.data = data;
  return res.status(statusCode).json(body);
};

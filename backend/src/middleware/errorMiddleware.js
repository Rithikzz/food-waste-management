import AppError from "../utils/AppError.js";

// ── Mongoose / driver error translators ───────────────────────────────────────

const handleCastError = (err) =>
  new AppError(`Invalid value for field '${err.path}': ${err.value}`, 400);

const handleDuplicateKey = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  return new AppError(`'${value}' is already registered for field '${field}'`, 400);
};

const handleValidationError = (err) => {
  const messages = Object.values(err.errors).map((e) => e.message);
  return new AppError(`Validation failed: ${messages.join(". ")}`, 400);
};

const handleJWTError = () =>
  new AppError("Invalid authentication token. Please log in again", 401);

const handleJWTExpiredError = () =>
  new AppError("Your session has expired. Please log in again", 401);

// ── 404 handler ───────────────────────────────────────────────────────────────

export const notFound = (req, res) =>
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  });

// ── Global error handler ──────────────────────────────────────────────────────

export const errorHandler = (err, req, res, _next) => {
  // Development: expose full stack for easier debugging
  if (process.env.NODE_ENV === "development") {
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
      stack: err.stack,
    });
  }

  // Translate known Mongoose / JWT errors into operational AppErrors
  let error = err;
  if (err.name === "CastError")         error = handleCastError(err);
  if (err.code === 11000)               error = handleDuplicateKey(err);
  if (err.name === "ValidationError")   error = handleValidationError(err);
  if (err.name === "JsonWebTokenError") error = handleJWTError();
  if (err.name === "TokenExpiredError") error = handleJWTExpiredError();

  // Operational errors: safe to send details to client
  if (error.isOperational) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
    });
  }

  // Programming / unknown errors: log internally, send generic message
  console.error("💥 UNHANDLED ERROR:", err);
  return res.status(500).json({
    success: false,
    message: "An unexpected error occurred. Please try again later",
  });
};

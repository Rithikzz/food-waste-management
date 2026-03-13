/**
 * Custom operational error class.
 * isOperational = true means this is a known, expected error
 * (bad user input, not found, unauthorized) — safe to send to client.
 * Programming bugs will have isOperational = false and return a generic 500.
 */
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;

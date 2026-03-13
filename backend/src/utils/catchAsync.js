/**
 * Wraps an async Express route handler so thrown errors are forwarded
 * to Express's next(err) without try/catch boilerplate in every controller.
 *
 * Usage:  export const myHandler = catchAsync(async (req, res) => { ... })
 */
export const catchAsync = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

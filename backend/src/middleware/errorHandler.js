const { ValidationError, UniqueConstraintError } = require('sequelize');

// Express recognizes an error-handling middleware by its 4 arguments —
// this must stay last in the middleware chain (see app.js). Every thrown
// or next(err)-ed error in the app funnels through here, so this is the
// single place that decides status codes and response shape.
function errorHandler(err, req, res, _next) {
  // Sequelize validation errors (e.g. our Booking endAfterStart check, or
  // a unique-email violation) carry useful per-field messages — surface
  // them as a 400 instead of falling through to a generic 500.
  if (err instanceof ValidationError || err instanceof UniqueConstraintError) {
    return res.status(400).json({
      message: err.errors.map((e) => e.message).join(', '),
    });
  }

  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Internal server error' : err.message;

  if (statusCode === 500) {
    // Only log unexpected errors — expected 4xx errors would just be noise.
    console.error(err);
  }

  res.status(statusCode).json({ message });
}

module.exports = errorHandler;

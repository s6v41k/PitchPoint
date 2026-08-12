// A regular Error subclass that carries an HTTP status code alongside the
// message. Controllers can `throw new ApiError(404, 'Pitch not found')` and
// the centralized error handler knows exactly what status/body to send,
// instead of every controller building its own res.status(...).json(...).
class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = ApiError;

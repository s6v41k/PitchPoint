// Express doesn't catch rejected promises from async route handlers on its
// own — an unhandled rejection would just hang the request. Wrapping every
// async handler in this lets us `throw` or reject normally and still have
// the error land in our centralized errorHandler via next(err).
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;

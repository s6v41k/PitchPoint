const { validationResult } = require('express-validator');
const ApiError = require('../utils/ApiError');

// Routes pass an array of express-validator chains (see routes/*.js), e.g.
// [body('email').isEmail(), body('password').isLength({ min: 6 })].
// This middleware runs them all, then rejects with a single 400 if any
// failed — so controllers never have to think about input validation.
function validate(checks) {
  return async (req, res, next) => {
    await Promise.all(checks.map((check) => check.run(req)));

    const result = validationResult(req);
    if (result.isEmpty()) return next();

    const message = result
      .array()
      .map((e) => `${e.path}: ${e.msg}`)
      .join(', ');
    next(new ApiError(400, message));
  };
}

module.exports = validate;

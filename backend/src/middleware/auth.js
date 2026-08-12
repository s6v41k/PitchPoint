const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

// Verifies the `Authorization: Bearer <token>` header and attaches the
// decoded payload ({ id, role }) to req.user. Any route after this in the
// chain can trust req.user to be a logged-in, valid user.
function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return next(new ApiError(401, 'Authentication required'));
  }

  const token = header.slice('Bearer '.length);

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new ApiError(401, 'Invalid or expired token'));
  }
}

// Factory, not a plain middleware, so routes can express *which* roles are
// allowed: `requireRole('owner')`. Must run after requireAuth since it
// reads req.user.
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, 'You do not have permission to do this'));
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };

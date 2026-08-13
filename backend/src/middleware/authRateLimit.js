const rateLimit = require('express-rate-limit');

// Keyed by IP (express-rate-limit's default), so these only slow down
// someone hammering a single endpoint from one machine — not a real
// defense against a distributed attack, but it stops the cheap, common
// case (a script guessing passwords, or spamming registrations/emails)
// without needing any external infrastructure.
function makeLimiter(windowMinutes, max, message) {
  return rateLimit({
    windowMs: windowMinutes * 60 * 1000,
    max,
    message: { message },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

const loginLimiter = makeLimiter(
  15,
  10,
  'Too many login attempts. Please try again in 15 minutes.'
);
// Generous on purpose: a whole classroom (or a grader clicking through a
// demo) can share one IP behind NAT, and this only needs to stop a script
// mass-creating accounts, not slow down normal signups.
const registerLimiter = makeLimiter(
  60,
  20,
  'Too many accounts created from this network. Please try again later.'
);
const forgotPasswordLimiter = makeLimiter(
  60,
  5,
  'Too many password reset requests. Please try again later.'
);

module.exports = { loginLimiter, registerLimiter, forgotPasswordLimiter };

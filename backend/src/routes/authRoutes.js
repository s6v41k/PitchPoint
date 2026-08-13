const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
const {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
} = require('../middleware/authRateLimit');
const {
  register,
  login,
  me,
  updateMe,
  forgotPassword,
  resetPassword,
  deleteMe,
  verifyEmail,
  resendVerification,
} = require('../controllers/authController');

const router = Router();

// One uppercase letter, one lowercase letter, one digit, one non-alphanumeric
// character, 8+ characters total — checked with lookaheads so each
// requirement can be anywhere in the string, in any order.
const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const STRONG_PASSWORD_MESSAGE =
  'Password must be at least 8 characters and include an uppercase letter, a lowercase letter, a number, and a special character';

router.post(
  '/register',
  registerLimiter,
  validate([
    // A max length exists purely to reject obviously-abusive input
    // (megabytes of text in a form field) before it ever reaches the
    // database — 100 characters is far beyond any real name.
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Name is required')
      .isLength({ max: 100 })
      .withMessage('Name must be 100 characters or fewer'),
    body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').matches(STRONG_PASSWORD_REGEX).withMessage(STRONG_PASSWORD_MESSAGE),
    body('role').optional().isIn(['player', 'owner']).withMessage('Role must be player or owner'),
  ]),
  register
);

router.post(
  '/login',
  loginLimiter,
  validate([
    body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  login
);

router.get('/me', requireAuth, me);

router.put(
  '/me',
  requireAuth,
  validate([
    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Name cannot be empty')
      .isLength({ max: 100 })
      .withMessage('Name must be 100 characters or fewer'),
    body('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('A valid email is required')
      .normalizeEmail(),
    body('currentPassword').optional().notEmpty(),
    body('newPassword')
      .optional()
      .matches(STRONG_PASSWORD_REGEX)
      .withMessage(STRONG_PASSWORD_MESSAGE),
  ]),
  updateMe
);

router.delete('/me', requireAuth, deleteMe);

router.post(
  '/forgot-password',
  forgotPasswordLimiter,
  validate([
    body('email').trim().isEmail().withMessage('A valid email is required').normalizeEmail(),
  ]),
  forgotPassword
);

router.post(
  '/reset-password',
  validate([
    body('token').notEmpty().withMessage('Reset token is required'),
    body('newPassword').matches(STRONG_PASSWORD_REGEX).withMessage(STRONG_PASSWORD_MESSAGE),
  ]),
  resetPassword
);

router.post(
  '/verify-email',
  validate([body('token').notEmpty().withMessage('Verification token is required')]),
  verifyEmail
);

router.post('/resend-verification', requireAuth, resendVerification);

module.exports = router;

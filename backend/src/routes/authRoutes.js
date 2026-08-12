const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { requireAuth } = require('../middleware/auth');
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

router.post(
  '/register',
  validate([
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['player', 'owner']).withMessage('Role must be player or owner'),
  ]),
  register
);

router.post(
  '/login',
  validate([
    body('email').isEmail().withMessage('A valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ]),
  login
);

router.get('/me', requireAuth, me);

router.put(
  '/me',
  requireAuth,
  validate([
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('email').optional().isEmail().withMessage('A valid email is required'),
    body('currentPassword').optional().notEmpty(),
    body('newPassword')
      .optional()
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters'),
  ]),
  updateMe
);

router.delete('/me', requireAuth, deleteMe);

router.post(
  '/forgot-password',
  validate([body('email').isEmail().withMessage('A valid email is required')]),
  forgotPassword
);

router.post(
  '/reset-password',
  validate([
    body('token').notEmpty().withMessage('Reset token is required'),
    body('newPassword')
      .isLength({ min: 6 })
      .withMessage('New password must be at least 6 characters'),
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

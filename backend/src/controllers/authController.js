const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { sendPasswordResetEmail, sendVerificationEmail } = require('../utils/mailer');
const deleteUserCascade = require('../utils/deleteUserCascade');

const SALT_ROUNDS = 10;
// Distinct token "purposes" so a password-reset or email-verify link can
// never be reused as a normal login/session token (or as each other),
// even though every one of these is just a JWT signed with the same
// secret.
const RESET_TOKEN_PURPOSE = 'password-reset';
const VERIFY_TOKEN_PURPOSE = 'email-verify';

// Shared by register/resend-verification: signs a 24h verification token
// and emails the link. Fire-and-forget (not awaited by callers) — mailer.js
// already swallows its own errors, and a slow/unreachable SMTP server
// should never delay the register response.
function sendVerification(user) {
  const verifyToken = jwt.sign(
    { id: user.id, purpose: VERIFY_TOKEN_PURPOSE },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
  const verifyLink = `${process.env.CLIENT_URL}/verify-email?token=${verifyToken}`;
  sendVerificationEmail(user.email, verifyLink);
}

// Signs a JWT carrying just enough info for the auth middleware to make
// decisions (id + role) without hitting the database on every request.
// The token itself is stateless — logging out is handled client-side by
// discarding it (see the frontend auth store).
function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
}

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const existing = await User.findOne({ where: { email } });
  if (existing) {
    throw new ApiError(409, 'An account with this email already exists');
  }

  // Never store the plaintext password — bcrypt.hash salts + hashes it in
  // one step, and the salt is embedded in the resulting hash string.
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ name, email, passwordHash, role });
  sendVerification(user);

  const token = signToken(user);
  res.status(201).json({ token, user: user.toSafeJSON() });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ where: { email } });
  // Same error message whether the email doesn't exist or the password is
  // wrong — this avoids leaking which emails are registered.
  if (!user) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    throw new ApiError(401, 'Invalid email or password');
  }

  const token = signToken(user);
  res.json({ token, user: user.toSafeJSON() });
});

// Used by the frontend on page load to restore a session from a stored
// token without asking the user to log in again.
const me = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);
  if (!user) throw new ApiError(404, 'User not found');
  res.json({ user: user.toSafeJSON() });
});

// PUT /api/auth/me — lets the logged-in user change their name/email
// and, optionally, their password. Password change is opt-in: only runs
// when `newPassword` is present, and requires the correct current
// password first so a stolen/left-open session can't be used to lock the
// real owner out of their account.
const updateMe = asyncHandler(async (req, res) => {
  const { name, email, currentPassword, newPassword } = req.body;

  const user = await User.findByPk(req.user.id);
  if (!user) throw new ApiError(404, 'User not found');

  if (email && email !== user.email) {
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      throw new ApiError(409, 'An account with this email already exists');
    }
    user.email = email;
  }

  if (name) user.name = name;

  if (newPassword) {
    if (!currentPassword) {
      throw new ApiError(400, 'Current password is required to set a new password');
    }
    const matches = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!matches) {
      throw new ApiError(401, 'Current password is incorrect');
    }
    user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  }

  await user.save();
  res.json({ user: user.toSafeJSON() });
});

// POST /api/auth/forgot-password — always responds the same way whether
// or not the email is registered, so this endpoint can't be used to probe
// which addresses have an account. If the address does exist, a
// short-lived reset link is emailed (see utils/mailer.js).
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ where: { email } });
  if (user) {
    const resetToken = jwt.sign(
      { id: user.id, purpose: RESET_TOKEN_PURPOSE },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );
    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    await sendPasswordResetEmail(user.email, resetLink);
  }

  res.json({ message: 'If that email is registered, a reset link has been sent.' });
});

// POST /api/auth/reset-password — the token is a JWT scoped to this one
// purpose (see RESET_TOKEN_PURPOSE), so even a leaked/expired one can
// never be replayed as a login session, and it naturally expires after
// 15 minutes without needing a database column to track it.
const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(400, 'This reset link is invalid or has expired');
  }
  if (decoded.purpose !== RESET_TOKEN_PURPOSE) {
    throw new ApiError(400, 'This reset link is invalid or has expired');
  }

  const user = await User.findByPk(decoded.id);
  if (!user) throw new ApiError(400, 'This reset link is invalid or has expired');

  user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await user.save();

  res.json({ message: 'Password reset successfully. You can now log in.' });
});

// POST /api/auth/verify-email — same token-purpose pattern as password
// reset (see RESET_TOKEN_PURPOSE): a 24h-lived JWT scoped to exactly this
// one action, so it can't be replayed as a session token or reused past
// its window without needing a database row to track it.
const verifyEmail = asyncHandler(async (req, res) => {
  const { token } = req.body;

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new ApiError(400, 'This verification link is invalid or has expired');
  }
  if (decoded.purpose !== VERIFY_TOKEN_PURPOSE) {
    throw new ApiError(400, 'This verification link is invalid or has expired');
  }

  const user = await User.findByPk(decoded.id);
  if (!user) throw new ApiError(400, 'This verification link is invalid or has expired');

  user.emailVerified = true;
  await user.save();

  res.json({ message: 'Email verified!' });
});

// POST /api/auth/resend-verification — logged-in only, so this can't be
// used to spam an arbitrary address with emails.
const resendVerification = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id);
  if (!user) throw new ApiError(404, 'User not found');
  if (user.emailVerified) {
    return res.json({ message: 'Your email is already verified.' });
  }

  sendVerification(user);
  res.json({ message: 'Verification email sent.' });
});

// DELETE /api/auth/me — a player's own bookings, or (if they're an owner)
// their pitches and every booking made on them, are deleted right along
// with the account. There's no "soft" undo here — this is the account
// itself asking to be forgotten, not a single resource.
const deleteMe = asyncHandler(async (req, res) => {
  await deleteUserCascade(req.user.id);
  res.status(204).send();
});

module.exports = {
  register,
  login,
  me,
  updateMe,
  forgotPassword,
  resetPassword,
  deleteMe,
  verifyEmail,
  resendVerification,
};

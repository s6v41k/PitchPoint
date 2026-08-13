const { Op } = require('sequelize');
const { User } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const deleteUserCascade = require('../utils/deleteUserCascade');

// GET /api/admin/users?search=... — search matches name or email.
// Every route in this controller is already behind requireRole('admin')
// (see adminRoutes.js), so no further permission checks are needed here.
const listUsers = asyncHandler(async (req, res) => {
  const { search } = req.query;
  const where = search
    ? {
        [Op.or]: [{ name: { [Op.like]: `%${search}%` } }, { email: { [Op.like]: `%${search}%` } }],
      }
    : {};

  const users = await User.findAll({ where, order: [['createdAt', 'DESC']] });
  res.json(users.map((u) => u.toSafeJSON()));
});

// A logged-in admin acting on their own row (demoting or deleting
// themselves) is almost always a misclick, not intent — and if they're
// the only admin, it's a self-lockout with no recovery path short of a
// direct database edit. Blocking it here costs nothing and prevents that.
function assertNotSelf(req, targetId) {
  if (targetId === req.user.id) {
    throw new ApiError(400, 'You cannot do this to your own account from the admin panel');
  }
}

// PATCH /api/admin/users/:id/role
const updateUserRole = asyncHandler(async (req, res) => {
  const targetId = Number(req.params.id);
  assertNotSelf(req, targetId);

  const user = await User.findByPk(targetId);
  if (!user) throw new ApiError(404, 'User not found');

  user.role = req.body.role;
  await user.save();
  res.json(user.toSafeJSON());
});

// DELETE /api/admin/users/:id — same cascade as a user deleting their own
// account (see utils/deleteUserCascade.js), just without the "is this me"
// framing.
const deleteUser = asyncHandler(async (req, res) => {
  const targetId = Number(req.params.id);
  assertNotSelf(req, targetId);

  const user = await User.findByPk(targetId);
  if (!user) throw new ApiError(404, 'User not found');

  await deleteUserCascade(targetId);
  res.status(204).send();
});

module.exports = { listUsers, updateUserRole, deleteUser };

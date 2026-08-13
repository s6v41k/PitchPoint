const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const { listUsers, updateUserRole, deleteUser } = require('../controllers/adminController');

const router = Router();

// Every route here is platform-wide, not scoped to "your own" anything —
// unlike requireRole('owner') routes, which only ever act on resources the
// caller owns. requireAuth + requireRole('admin') gates the whole router.
router.use(requireAuth, requireRole('admin'));

router.get('/users', listUsers);

router.patch(
  '/users/:id/role',
  validate([
    body('role')
      .isIn(['player', 'owner', 'admin'])
      .withMessage('role must be player, owner or admin'),
  ]),
  updateUserRole
);

router.delete('/users/:id', deleteUser);

module.exports = router;

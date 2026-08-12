const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  getMyBookings,
  getOwnerBookings,
  createBooking,
  cancelBooking,
} = require('../controllers/bookingController');

const router = Router();

// Every booking route requires a logged-in user.
router.use(requireAuth);

router.get('/me', getMyBookings);
router.get('/owner', requireRole('owner'), getOwnerBookings);

router.post(
  '/',
  validate([
    body('pitchId').isInt({ gt: 0 }).withMessage('pitchId is required'),
    body('date')
      .matches(/^\d{4}-\d{2}-\d{2}$/)
      .withMessage('date must be in YYYY-MM-DD format'),
    // Bookings only run on the hour (09:00, 10:00, ...), never on the
    // half-hour — this guarantees every slot is a whole number of hours
    // long and rules out the awkward 30-minute gaps a free-form time
    // picker would allow between adjacent bookings.
    body('startTime')
      .matches(/^([01]\d|2[0-3]):00(:00)?$/)
      .withMessage('startTime must be on the hour, e.g. 14:00'),
    body('endTime')
      .matches(/^([01]\d|2[0-3]):00(:00)?$/)
      .withMessage('endTime must be on the hour, e.g. 15:00'),
  ]),
  createBooking
);

router.delete('/:id', cancelBooking);

module.exports = router;

const { Router } = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { requireAuth, requireRole } = require('../middleware/auth');
const {
  listPitches,
  listMyPitches,
  getPitch,
  getPitchBookings,
  createPitch,
  updatePitch,
  deletePitch,
} = require('../controllers/pitchController');
const { listReviews, upsertReview, deleteReview } = require('../controllers/reviewController');
const { listClosures, createClosure, deleteClosure } = require('../controllers/closureController');
const {
  listMyWaitlistEntries,
  joinWaitlist,
  leaveWaitlist,
} = require('../controllers/waitlistController');

const router = Router();

// Shared by bookings, closures, and waitlist entries — all keyed by the
// same [date, startTime, endTime] shape, on the hour, same as bookings
// (see bookingRoutes.js).
const slotValidation = [
  body('date')
    .matches(/^\d{4}-\d{2}-\d{2}$/)
    .withMessage('date must be in YYYY-MM-DD format'),
  body('startTime')
    .matches(/^([01]\d|2[0-3]):00(:00)?$/)
    .withMessage('startTime must be on the hour, e.g. 14:00'),
  body('endTime')
    .matches(/^([01]\d|2[0-3]):00(:00)?$/)
    .withMessage('endTime must be on the hour, e.g. 15:00'),
];

const pitchValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ max: 150 })
    .withMessage('Name must be 150 characters or fewer'),
  body('address')
    .trim()
    .notEmpty()
    .withMessage('Address is required')
    .isLength({ max: 200 })
    .withMessage('Address must be 200 characters or fewer'),
  body('lat').optional({ nullable: true }).isFloat().withMessage('lat must be a number'),
  body('lng').optional({ nullable: true }).isFloat().withMessage('lng must be a number'),
  body('surfaceType')
    .isIn(['grass', 'artificial_turf', 'indoor'])
    .withMessage('surfaceType must be grass, artificial_turf or indoor'),
  body('size').isIn(['5v5', '7v7', '11v11']).withMessage('size must be 5v5, 7v7 or 11v11'),
  body('pricePerHour').isFloat({ gt: 0 }).withMessage('pricePerHour must be a positive number'),
  body('photos').optional().isArray().withMessage('photos must be an array'),
  // On-the-hour, same as bookings — keeps the availability grid's column
  // boundaries meaningful (see bookingRoutes.js for the matching rule).
  body('openTime')
    .optional()
    .matches(/^([01]\d|2[0-3]):00(:00)?$/)
    .withMessage('openTime must be on the hour, e.g. 08:00'),
  body('closeTime')
    .optional()
    .matches(/^([01]\d|2[0-3]):00(:00)?$/)
    .withMessage('closeTime must be on the hour, e.g. 22:00'),
  body().custom((value) => {
    if (value.openTime && value.closeTime && value.openTime >= value.closeTime) {
      throw new Error('openTime must be before closeTime');
    }
    return true;
  }),
];

// Public routes — anyone can browse pitches without logging in.
router.get('/', listPitches);

// NOTE: `/mine` must be declared before `/:id`, otherwise Express would
// match it as `GET /:id` with id === "mine".
router.get('/mine', requireAuth, requireRole('owner'), listMyPitches);

router.get('/:id', getPitch);
router.get('/:id/bookings', getPitchBookings);

router.get('/:id/reviews', listReviews);
router.post(
  '/:id/reviews',
  requireAuth,
  validate([
    body('rating').isInt({ min: 1, max: 5 }).withMessage('rating must be an integer from 1 to 5'),
    body('comment')
      .optional({ nullable: true })
      .isLength({ max: 1000 })
      .withMessage('comment is too long'),
  ]),
  upsertReview
);
router.delete('/:id/reviews', requireAuth, deleteReview);

router.get('/:id/closures', listClosures);
router.post(
  '/:id/closures',
  requireAuth,
  requireRole('owner'),
  validate([
    ...slotValidation,
    body('reason')
      .optional({ nullable: true })
      .trim()
      .isLength({ max: 200 })
      .withMessage('Reason must be 200 characters or fewer'),
  ]),
  createClosure
);
router.delete('/:id/closures/:closureId', requireAuth, requireRole('owner'), deleteClosure);

router.get('/:id/waitlist/mine', requireAuth, listMyWaitlistEntries);
router.post('/:id/waitlist', requireAuth, validate(slotValidation), joinWaitlist);
router.delete('/:id/waitlist/:entryId', requireAuth, leaveWaitlist);

// Owner-only routes.
router.post('/', requireAuth, requireRole('owner'), validate(pitchValidation), createPitch);
router.put('/:id', requireAuth, requireRole('owner'), validate(pitchValidation), updatePitch);
router.delete('/:id', requireAuth, requireRole('owner'), deletePitch);

module.exports = router;

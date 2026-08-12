const { Booking, Review, User } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

const REVIEWER_ATTRIBUTES = ['id', 'name'];

// GET /api/pitches/:id/reviews — public, newest first.
const listReviews = asyncHandler(async (req, res) => {
  const reviews = await Review.findAll({
    where: { pitchId: req.params.id },
    include: [{ model: User, as: 'user', attributes: REVIEWER_ATTRIBUTES }],
    order: [['createdAt', 'DESC']],
  });
  res.json(reviews);
});

// POST /api/pitches/:id/reviews — one review per player per pitch. Only
// someone who has actually booked the pitch can leave one (checked
// below), and posting again replaces their existing review rather than
// creating a second one — enforced by the unique (pitchId, userId) index
// on the model, which this upsert relies on.
const upsertReview = asyncHandler(async (req, res) => {
  const pitchId = req.params.id;
  const { rating, comment } = req.body;

  const hasBooked = await Booking.findOne({
    where: { pitchId, userId: req.user.id },
  });
  if (!hasBooked) {
    throw new ApiError(403, 'You can only review pitches you have booked');
  }

  const [review] = await Review.upsert(
    { pitchId, userId: req.user.id, rating, comment },
    { returning: true }
  );

  const withReviewer = await Review.findByPk(review.id, {
    include: [{ model: User, as: 'user', attributes: REVIEWER_ATTRIBUTES }],
  });
  res.status(201).json(withReviewer);
});

// DELETE /api/pitches/:id/reviews — removes the logged-in user's own
// review for this pitch (there's at most one, per the unique index).
const deleteReview = asyncHandler(async (req, res) => {
  await Review.destroy({ where: { pitchId: req.params.id, userId: req.user.id } });
  res.status(204).send();
});

module.exports = { listReviews, upsertReview, deleteReview };

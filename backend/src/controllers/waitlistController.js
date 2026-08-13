const { Booking, Waitlist } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');

// GET /api/pitches/:id/waitlist/mine — the logged-in player's own waitlist
// entries for this pitch, so the frontend can show "you're on the list"
// instead of "join the waiting list" for a slot they've already joined.
const listMyWaitlistEntries = asyncHandler(async (req, res) => {
  const entries = await Waitlist.findAll({
    where: { pitchId: req.params.id, userId: req.user.id },
  });
  res.json(entries);
});

// POST /api/pitches/:id/waitlist — join the line for a slot that's
// currently booked by someone else. Joining a slot that's actually free
// (or already yours) doesn't make sense — book it directly instead.
const joinWaitlist = asyncHandler(async (req, res) => {
  const pitchId = req.params.id;
  const { date, startTime, endTime } = req.body;

  const reserved = await Booking.findOne({
    where: { pitchId, date, startTime, endTime, status: 'confirmed' },
  });
  if (!reserved) {
    throw new ApiError(400, "This slot isn't booked — you can book it directly instead.");
  }
  if (reserved.userId === req.user.id) {
    throw new ApiError(400, "You can't join the waiting list for your own booking.");
  }

  const existing = await Waitlist.findOne({
    where: { pitchId, userId: req.user.id, date, startTime, endTime },
  });
  if (existing) {
    throw new ApiError(409, "You're already on the waiting list for this slot.");
  }

  const entry = await Waitlist.create({ pitchId, userId: req.user.id, date, startTime, endTime });
  res.status(201).json(entry);
});

// DELETE /api/pitches/:id/waitlist/:entryId
const leaveWaitlist = asyncHandler(async (req, res) => {
  const entry = await Waitlist.findByPk(req.params.entryId);
  if (!entry || entry.pitchId !== Number(req.params.id)) {
    throw new ApiError(404, 'Waitlist entry not found');
  }
  if (entry.userId !== req.user.id) {
    throw new ApiError(403, 'You can only leave your own waitlist entry');
  }

  await entry.destroy();
  res.status(204).send();
});

module.exports = { listMyWaitlistEntries, joinWaitlist, leaveWaitlist };

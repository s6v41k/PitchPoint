const { Op } = require('sequelize');
const { Booking, Closure } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const loadOwnedPitch = require('../utils/loadOwnedPitch');

// GET /api/pitches/:id/closures[?date=YYYY-MM-DD] — public, like bookings:
// the availability grid needs to know about closures for whichever dates
// it's showing. With no date filter (used by the owner's management
// panel), returns every closure from today onward instead of the whole
// history.
const listClosures = asyncHandler(async (req, res) => {
  const { date } = req.query;
  const todayStr = new Date().toISOString().slice(0, 10);

  const closures = await Closure.findAll({
    where: {
      pitchId: req.params.id,
      date: date || { [Op.gte]: todayStr },
    },
    order: [
      ['date', 'ASC'],
      ['startTime', 'ASC'],
    ],
  });
  res.json(closures);
});

// POST /api/pitches/:id/closures — owner-only, own pitch. Refuses to
// shadow a slot someone already paid for in confirmed-booking terms —
// the owner cancels that booking first, so the player finds out.
const createClosure = asyncHandler(async (req, res) => {
  const pitch = await loadOwnedPitch(req);
  const { date, startTime, endTime, reason } = req.body;

  const bookingConflict = await Booking.findOne({
    where: {
      pitchId: pitch.id,
      date,
      status: 'confirmed',
      startTime: { [Op.lt]: endTime },
      endTime: { [Op.gt]: startTime },
    },
  });
  if (bookingConflict) {
    throw new ApiError(
      409,
      'There is already a confirmed booking in that window — cancel it first if this pitch needs to close.'
    );
  }

  const closure = await Closure.create({ pitchId: pitch.id, date, startTime, endTime, reason });
  res.status(201).json(closure);
});

// DELETE /api/pitches/:id/closures/:closureId — owner-only, own pitch.
const deleteClosure = asyncHandler(async (req, res) => {
  const pitch = await loadOwnedPitch(req);

  const closure = await Closure.findByPk(req.params.closureId);
  if (!closure || closure.pitchId !== pitch.id) {
    throw new ApiError(404, 'Closure not found');
  }

  await closure.destroy();
  res.status(204).send();
});

module.exports = { listClosures, createClosure, deleteClosure };

const { Op } = require('sequelize');
const { sequelize, Booking, Pitch, User, Waitlist, Closure } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const { notifyAutomation } = require('../utils/webhook');
const { sendBookingConfirmationEmail, sendWaitlistPromotedEmail } = require('../utils/mailer');

const PITCH_ATTRIBUTES = ['id', 'name', 'address', 'pricePerHour'];
const USER_ATTRIBUTES = ['id', 'name', 'email'];

// A cancelled booking frees up its slot immediately, but a cancellation
// minutes before kickoff leaves an owner no realistic chance to refill
// it — so the window right before start is locked once a booking is
// confirmed.
const CANCELLATION_CUTOFF_HOURS = 2;

// GET /api/bookings/me — everything the logged-in player has booked,
// newest first, with just enough pitch info to render a list.
const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.findAll({
    where: { userId: req.user.id },
    include: [{ model: Pitch, as: 'pitch', attributes: PITCH_ATTRIBUTES }],
    order: [
      ['date', 'DESC'],
      ['startTime', 'DESC'],
    ],
  });
  res.json(bookings);
});

// GET /api/bookings/owner — every booking made on any pitch this owner
// manages. Powers the "bookings for my pitches" panel of the dashboard.
const getOwnerBookings = asyncHandler(async (req, res) => {
  const bookings = await Booking.findAll({
    include: [
      {
        model: Pitch,
        as: 'pitch',
        attributes: PITCH_ATTRIBUTES,
        where: { ownerId: req.user.id },
      },
      { model: User, as: 'user', attributes: USER_ATTRIBUTES },
    ],
    order: [
      ['date', 'DESC'],
      ['startTime', 'DESC'],
    ],
  });
  res.json(bookings);
});

// POST /api/bookings
//
// The core business rule of the whole app: a pitch can't be double-booked.
// Two [start, end) time ranges overlap exactly when
//   existing.startTime < new.endTime  AND  existing.endTime > new.startTime
// (the classic interval-overlap test). We look for any *confirmed*
// booking on the same pitch/date matching that condition.
//
// Checking-then-creating is a classic race condition: two requests for the
// same free slot could both pass the check before either has inserted its
// row. We close that gap with a transaction that takes a row lock
// (`LOCK.UPDATE`, i.e. `SELECT ... FOR UPDATE`) on the pitch itself —
// concurrent bookings for the *same* pitch are forced to run one at a
// time, so the second request's overlap check always sees the first
// request's new booking. Bookings for different pitches are unaffected
// and still run fully in parallel.
const createBooking = asyncHandler(async (req, res) => {
  const { pitchId, date, startTime, endTime } = req.body;

  const { booking, pitch } = await sequelize.transaction(async (t) => {
    const pitch = await Pitch.findByPk(pitchId, {
      transaction: t,
      lock: t.LOCK.UPDATE,
    });
    if (!pitch) throw new ApiError(404, 'Pitch not found');

    // Each pitch has its own opening hours (see models/Pitch.js) — a
    // booking that starts before opening or ends after closing is
    // rejected the same way an overlapping booking is, so a direct API
    // call can't bypass what the frontend's availability grid already
    // prevents by only offering hours inside [openTime, closeTime).
    // Compare only the HH:MM prefix on both sides. Sequelize returns TIME
    // columns as 'HH:MM:SS' while the client sends 'HH:MM' — comparing
    // those two formats directly is a trap: the string "07:00" sorts as
    // *less than* "07:00:00" (a shorter string that's a prefix of a
    // longer one always does), even though they mean the exact same time.
    // That falsely rejected every booking starting exactly at opening
    // time. Slicing both sides to 5 characters first avoids the mismatch.
    const openTime = pitch.openTime.slice(0, 5);
    const closeTime = pitch.closeTime.slice(0, 5);
    if (startTime.slice(0, 5) < openTime || endTime.slice(0, 5) > closeTime) {
      throw new ApiError(400, `This pitch is only open from ${openTime} to ${closeTime}`);
    }

    const overlapping = await Booking.findOne({
      where: {
        pitchId,
        date,
        status: 'confirmed',
        startTime: { [Op.lt]: endTime },
        endTime: { [Op.gt]: startTime },
      },
      transaction: t,
    });
    if (overlapping) {
      throw new ApiError(409, 'That time slot is already booked');
    }

    const closed = await Closure.findOne({
      where: {
        pitchId,
        date,
        startTime: { [Op.lt]: endTime },
        endTime: { [Op.gt]: startTime },
      },
      transaction: t,
    });
    if (closed) {
      throw new ApiError(
        409,
        `This pitch is closed during that time${closed.reason ? `: ${closed.reason}` : ''}`
      );
    }

    const booking = await Booking.create(
      { pitchId, userId: req.user.id, date, startTime, endTime },
      { transaction: t }
    );
    return { booking, pitch };
  });

  res.status(201).json(booking);

  // Fire-and-forget from here on: the response is already sent, so a slow
  // or unreachable webhook/SMTP server can never add latency to — or
  // fail — the booking itself. See utils/webhook.js and utils/mailer.js.
  const player = await User.findByPk(req.user.id, { attributes: ['name', 'email'] });
  notifyAutomation('booking.created', {
    bookingId: booking.id,
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
    pitch: { id: pitch.id, name: pitch.name, address: pitch.address },
    player: { name: player.name, email: player.email },
  });
  sendBookingConfirmationEmail(player.email, {
    pitchName: pitch.name,
    pitchAddress: pitch.address,
    date: booking.date,
    startTime: booking.startTime,
    endTime: booking.endTime,
  });
});

// DELETE /api/bookings/:id — cancels (does not hard-delete) a booking, and
// only if the requester is the player who made it. Soft-cancelling keeps
// the row around so "past bookings" history stays accurate and the slot
// visibly frees up for others.
//
// If someone was waiting for exactly this slot, cancelling immediately
// promotes the longest-waiting entry into a real confirmed booking — same
// row-locked-transaction discipline as createBooking, so a promotion can
// never race a brand new booking attempt for the same freed slot.
const cancelBooking = asyncHandler(async (req, res) => {
  const booking = await Booking.findByPk(req.params.id);
  if (!booking) throw new ApiError(404, 'Booking not found');
  if (booking.userId !== req.user.id) {
    throw new ApiError(403, 'You can only cancel your own bookings');
  }

  if (booking.status === 'confirmed') {
    const startsAt = new Date(`${booking.date}T${booking.startTime}`);
    const hoursUntilStart = (startsAt.getTime() - Date.now()) / (60 * 60 * 1000);
    if (hoursUntilStart < CANCELLATION_CUTOFF_HOURS) {
      throw new ApiError(
        400,
        `Bookings can't be cancelled within ${CANCELLATION_CUTOFF_HOURS} hours of the start time`
      );
    }
  }

  const { pitchId, date, startTime, endTime } = booking;

  const promoted = await sequelize.transaction(async (t) => {
    await Pitch.findByPk(pitchId, { transaction: t, lock: t.LOCK.UPDATE });

    booking.status = 'cancelled';
    await booking.save({ transaction: t });

    const nextInLine = await Waitlist.findOne({
      where: { pitchId, date, startTime, endTime },
      order: [['createdAt', 'ASC']],
      transaction: t,
    });
    if (!nextInLine) return null;

    const promotedBooking = await Booking.create(
      { pitchId, userId: nextInLine.userId, date, startTime, endTime },
      { transaction: t }
    );
    await nextInLine.destroy({ transaction: t });
    return promotedBooking;
  });

  res.json(booking);

  if (promoted) {
    const [pitch, promotedUser] = await Promise.all([
      Pitch.findByPk(pitchId, { attributes: ['name', 'address'] }),
      User.findByPk(promoted.userId, { attributes: ['email'] }),
    ]);
    sendWaitlistPromotedEmail(promotedUser.email, {
      pitchName: pitch.name,
      pitchAddress: pitch.address,
      date: promoted.date,
      startTime: promoted.startTime,
      endTime: promoted.endTime,
    });
  }
});

module.exports = { getMyBookings, getOwnerBookings, createBooking, cancelBooking };

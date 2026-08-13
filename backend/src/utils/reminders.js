const { Op } = require('sequelize');
const { Booking, Pitch, User } = require('../models');
const { sendBookingReminderEmail } = require('./mailer');

const HOUR_MS = 60 * 60 * 1000;
// A 2-hour-wide target window (23h-25h before kickoff) rather than exactly
// 24h: this only runs once an hour (see server.js), so a fixed instant
// would be missed by the polling gap. Every confirmed booking still gets
// exactly one reminder, just with up to an hour of slack in exactly when.
const WINDOW_START_MS = 23 * HOUR_MS;
const WINDOW_END_MS = 25 * HOUR_MS;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}
function tomorrowStr() {
  const d = new Date();
  d.setDate(d.getDate() + 2); // +2, not +1: a booking tomorrow late at night can still be ~25h out right now
  return d.toISOString().slice(0, 10);
}

// Exported (not just wired to the interval below) so it can be called
// directly — from a one-off script or a test — without waiting for the
// next hourly tick.
async function sendUpcomingReminders() {
  const candidates = await Booking.findAll({
    where: {
      status: 'confirmed',
      reminderSent: false,
      date: { [Op.between]: [todayStr(), tomorrowStr()] },
    },
    include: [
      { model: Pitch, as: 'pitch', attributes: ['name', 'address'] },
      { model: User, as: 'user', attributes: ['email'] },
    ],
  });

  const now = Date.now();
  let sentCount = 0;

  for (const booking of candidates) {
    const startsAt = new Date(`${booking.date}T${booking.startTime}`);
    const msUntilStart = startsAt.getTime() - now;
    if (msUntilStart < WINDOW_START_MS || msUntilStart > WINDOW_END_MS) continue;

    sendBookingReminderEmail(booking.user.email, {
      pitchName: booking.pitch.name,
      pitchAddress: booking.pitch.address,
      date: booking.date,
      startTime: booking.startTime,
      endTime: booking.endTime,
    });
    booking.reminderSent = true;
    await booking.save();
    sentCount += 1;
  }

  return sentCount;
}

module.exports = { sendUpcomingReminders };

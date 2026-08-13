const { Op } = require('sequelize');
const { sequelize, User, Pitch, Booking, Review, Waitlist, Closure } = require('../models');

// Deletes a user and everything that only makes sense in the context of
// their account: their own bookings/reviews/waitlist entries, and — if
// they're an owner — their pitches plus every booking/review/waitlist
// entry/closure attached to those pitches. Shared by the self-service
// "delete my account" flow and the admin user-management panel, which
// both need the exact same cascade.
//
// Order matters: Review and Waitlist reference both users and pitches, and
// Closure references pitches, so all three have to go before Booking/
// Pitch/User or MySQL rejects the delete with a foreign-key error.
async function deleteUserCascade(userId) {
  await sequelize.transaction(async (t) => {
    const ownedPitches = await Pitch.findAll({
      where: { ownerId: userId },
      attributes: ['id'],
      transaction: t,
    });
    const pitchIds = ownedPitches.map((p) => p.id);
    const byUserOrTheirPitches =
      pitchIds.length > 0 ? { [Op.or]: [{ userId }, { pitchId: pitchIds }] } : { userId };

    await Waitlist.destroy({ where: byUserOrTheirPitches, transaction: t });
    await Review.destroy({ where: byUserOrTheirPitches, transaction: t });
    if (pitchIds.length > 0) {
      await Closure.destroy({ where: { pitchId: pitchIds }, transaction: t });
    }

    await Booking.destroy({ where: { userId }, transaction: t });
    if (pitchIds.length > 0) {
      await Booking.destroy({ where: { pitchId: pitchIds }, transaction: t });
      await Pitch.destroy({ where: { ownerId: userId }, transaction: t });
    }

    await User.destroy({ where: { id: userId }, transaction: t });
  });
}

module.exports = deleteUserCascade;

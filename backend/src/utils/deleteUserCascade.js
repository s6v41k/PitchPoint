const { sequelize, User, Pitch, Booking } = require('../models');

// Deletes a user and everything that only makes sense in the context of
// their account: their own bookings, and — if they're an owner — their
// pitches plus every booking made on those pitches. Shared by the
// self-service "delete my account" flow and the admin user-management
// panel, which both need the exact same cascade.
async function deleteUserCascade(userId) {
  await sequelize.transaction(async (t) => {
    await Booking.destroy({ where: { userId }, transaction: t });

    const ownedPitches = await Pitch.findAll({
      where: { ownerId: userId },
      attributes: ['id'],
      transaction: t,
    });
    const pitchIds = ownedPitches.map((p) => p.id);
    if (pitchIds.length > 0) {
      await Booking.destroy({ where: { pitchId: pitchIds }, transaction: t });
      await Pitch.destroy({ where: { ownerId: userId }, transaction: t });
    }

    await User.destroy({ where: { id: userId }, transaction: t });
  });
}

module.exports = deleteUserCascade;

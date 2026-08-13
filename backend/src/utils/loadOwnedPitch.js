const { Pitch } = require('../models');
const ApiError = require('./ApiError');

// Shared by every controller that manages a resource scoped to "your own
// pitch" (the pitch itself, its closures, ...): loads the pitch and throws
// unless the logged-in user is the one who owns it, so that check can't
// accidentally be skipped in one of the call sites.
async function loadOwnedPitch(req) {
  const pitch = await Pitch.findByPk(req.params.id);
  if (!pitch) throw new ApiError(404, 'Pitch not found');
  if (pitch.ownerId !== req.user.id) {
    throw new ApiError(403, 'You do not own this pitch');
  }
  return pitch;
}

module.exports = loadOwnedPitch;

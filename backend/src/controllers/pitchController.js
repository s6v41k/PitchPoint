const { Op, fn, col } = require('sequelize');
const { Pitch, User, Booking, Review } = require('../models');
const ApiError = require('../utils/ApiError');
const asyncHandler = require('../utils/asyncHandler');
const loadOwnedPitch = require('../utils/loadOwnedPitch');

// Only ever return this subset of User columns when a pitch's owner is
// included — never leak passwordHash to the client.
const OWNER_ATTRIBUTES = ['id', 'name', 'email'];

// Attaches { avgRating, reviewCount } to each pitch with a single grouped
// aggregate query, instead of one Review query per pitch (N+1). Pitches
// with no reviews simply get avgRating: null, reviewCount: 0.
async function attachRatings(pitches) {
  const ids = pitches.map((p) => p.id);
  if (ids.length === 0) return [];

  const stats = await Review.findAll({
    where: { pitchId: ids },
    attributes: [
      'pitchId',
      [fn('AVG', col('rating')), 'avgRating'],
      [fn('COUNT', col('id')), 'reviewCount'],
    ],
    group: ['pitchId'],
    raw: true,
  });
  const statsByPitchId = Object.fromEntries(stats.map((s) => [s.pitchId, s]));

  return pitches.map((pitch) => {
    const stat = statsByPitchId[pitch.id];
    return {
      ...pitch.toJSON(),
      avgRating: stat ? Number(stat.avgRating) : null,
      reviewCount: stat ? Number(stat.reviewCount) : 0,
    };
  });
}

// GET /api/pitches?search=&surfaceType=&size=&minPrice=&maxPrice=
// Public browse/search endpoint — builds a Sequelize `where` clause only
// from filters that were actually provided, so an empty query returns
// every pitch.
const listPitches = asyncHandler(async (req, res) => {
  const { search, surfaceType, size, minPrice, maxPrice } = req.query;

  const where = {};

  if (search) {
    where[Op.or] = [
      { name: { [Op.like]: `%${search}%` } },
      { address: { [Op.like]: `%${search}%` } },
    ];
  }
  if (surfaceType) where.surfaceType = surfaceType;
  if (size) where.size = size;
  if (minPrice || maxPrice) {
    where.pricePerHour = {};
    if (minPrice) where.pricePerHour[Op.gte] = minPrice;
    if (maxPrice) where.pricePerHour[Op.lte] = maxPrice;
  }

  const pitches = await Pitch.findAll({
    where,
    include: [{ model: User, as: 'owner', attributes: OWNER_ATTRIBUTES }],
    order: [['createdAt', 'DESC']],
  });

  res.json(await attachRatings(pitches));
});

// GET /api/pitches/mine — owner-only. Pulls the logged-in owner's pitches
// together with their bookings so the dashboard can render both without a
// second round-trip per pitch.
const listMyPitches = asyncHandler(async (req, res) => {
  const pitches = await Pitch.findAll({
    where: { ownerId: req.user.id },
    include: [{ model: Booking, as: 'bookings' }],
    order: [['createdAt', 'DESC']],
  });
  res.json(pitches);
});

const getPitch = asyncHandler(async (req, res) => {
  const pitch = await Pitch.findByPk(req.params.id, {
    include: [{ model: User, as: 'owner', attributes: OWNER_ATTRIBUTES }],
  });
  if (!pitch) throw new ApiError(404, 'Pitch not found');
  const [withRating] = await attachRatings([pitch]);
  res.json(withRating);
});

// GET /api/pitches/:id/bookings?date=YYYY-MM-DD
// Lets the booking form show which time slots are already taken on a
// given day, before the player even tries to submit — the real overlap
// check still happens server-side in bookingController on POST.
const getPitchBookings = asyncHandler(async (req, res) => {
  const { date } = req.query;
  if (!date) throw new ApiError(400, 'date query param is required');

  const bookings = await Booking.findAll({
    where: { pitchId: req.params.id, date, status: 'confirmed' },
    attributes: ['id', 'startTime', 'endTime'],
    order: [['startTime', 'ASC']],
  });
  res.json(bookings);
});

const createPitch = asyncHandler(async (req, res) => {
  const { name, address, lat, lng, surfaceType, size, pricePerHour, photos, openTime, closeTime } =
    req.body;

  const pitch = await Pitch.create({
    name,
    address,
    lat,
    lng,
    surfaceType,
    size,
    pricePerHour,
    photos: photos || [],
    openTime,
    closeTime,
    ownerId: req.user.id, // taken from the JWT, never trusted from the body
  });

  res.status(201).json(pitch);
});

const updatePitch = asyncHandler(async (req, res) => {
  const pitch = await loadOwnedPitch(req);

  const { name, address, lat, lng, surfaceType, size, pricePerHour, photos, openTime, closeTime } =
    req.body;
  await pitch.update({
    name,
    address,
    lat,
    lng,
    surfaceType,
    size,
    pricePerHour,
    photos,
    openTime,
    closeTime,
  });

  res.json(pitch);
});

const deletePitch = asyncHandler(async (req, res) => {
  const pitch = await loadOwnedPitch(req);
  await pitch.destroy();
  res.status(204).send();
});

module.exports = {
  listPitches,
  listMyPitches,
  getPitch,
  getPitchBookings,
  createPitch,
  updatePitch,
  deletePitch,
};

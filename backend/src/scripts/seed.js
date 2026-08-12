// Optional convenience script: populates the database with a couple of
// accounts and pitches so the frontend has something to show immediately.
// Run with `npm run db:seed` (backend). Safe to re-run — it clears the
// three tables first.
require('dotenv').config();
const bcrypt = require('bcrypt');
const { sequelize, User, Pitch, Booking } = require('../models');

async function seed() {
  await sequelize.sync({ alter: true });

  // Plain DELETEs in child-to-parent order, not TRUNCATE: MySQL refuses to
  // TRUNCATE a table that any foreign key still references — even an
  // already-empty one — so truncating `pitches` while `bookings` has an FK
  // to it fails regardless of order. DELETE has no such restriction.
  await Booking.destroy({ where: {} });
  await Pitch.destroy({ where: {} });
  await User.destroy({ where: {} });

  const passwordHash = await bcrypt.hash('password123', 10);

  const owner = await User.create({
    name: 'Olivier Owner',
    email: 'owner@example.com',
    passwordHash,
    role: 'owner',
  });

  const player = await User.create({
    name: 'Paul Player',
    email: 'player@example.com',
    passwordHash,
    role: 'player',
  });

  await Pitch.bulkCreate([
    {
      name: 'Stade Communal de Woluwe',
      address: 'Avenue Parmentier 12, 1200 Woluwe-Saint-Lambert',
      lat: 50.8467,
      lng: 4.4327,
      surfaceType: 'artificial_turf',
      size: '7v7',
      pricePerHour: 45,
      photos: [],
      ownerId: owner.id,
    },
    {
      name: 'Complexe Sportif Sainte-Anne',
      address: 'Rue de la Prairie 5, 1050 Ixelles',
      lat: 50.8253,
      lng: 4.3663,
      surfaceType: 'grass',
      size: '11v11',
      pricePerHour: 80,
      photos: [],
      ownerId: owner.id,
    },
    {
      name: 'Indoor Five Anderlecht',
      address: 'Chaussée de Mons 200, 1070 Anderlecht',
      lat: 50.8365,
      lng: 4.3078,
      surfaceType: 'indoor',
      size: '5v5',
      pricePerHour: 35,
      photos: [],
      ownerId: owner.id,
    },
  ]);

  console.log('Seed complete. Test accounts (password: "password123"):');
  console.log(`  owner:  ${owner.email}`);
  console.log(`  player: ${player.email}`);
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

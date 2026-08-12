// Central place where all model associations are declared. Keeping this
// separate from the model definitions avoids circular `require`s between
// e.g. User.js and Pitch.js (each would need to require the other).
const sequelize = require('../config/database');
const User = require('./User');
const Pitch = require('./Pitch');
const Booking = require('./Booking');
const Review = require('./Review');

// A User (owner) has many Pitches; a Pitch belongs to one User (owner).
User.hasMany(Pitch, { foreignKey: 'ownerId', as: 'pitches' });
Pitch.belongsTo(User, { foreignKey: 'ownerId', as: 'owner' });

// A User (player) has many Bookings; a Booking belongs to one User.
User.hasMany(Booking, { foreignKey: 'userId', as: 'bookings' });
Booking.belongsTo(User, { foreignKey: 'userId', as: 'user' });

// A Pitch has many Bookings; a Booking belongs to one Pitch.
Pitch.hasMany(Booking, { foreignKey: 'pitchId', as: 'bookings' });
Booking.belongsTo(Pitch, { foreignKey: 'pitchId', as: 'pitch' });

// A Pitch has many Reviews; a Review belongs to one Pitch and one User.
Pitch.hasMany(Review, { foreignKey: 'pitchId', as: 'reviews' });
Review.belongsTo(Pitch, { foreignKey: 'pitchId', as: 'pitch' });
User.hasMany(Review, { foreignKey: 'userId', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'userId', as: 'user' });

module.exports = { sequelize, User, Pitch, Booking, Review };

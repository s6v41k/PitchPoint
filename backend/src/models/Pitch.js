const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Pitch extends Model {}

Pitch.init(
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    address: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // Stored separately (rather than a single "geo point") so plain SQL
    // ORDER BY / range filters work without needing MySQL spatial types.
    lat: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    lng: {
      type: DataTypes.FLOAT,
      allowNull: true,
    },
    surfaceType: {
      type: DataTypes.ENUM('grass', 'artificial_turf', 'indoor'),
      allowNull: false,
    },
    size: {
      type: DataTypes.ENUM('5v5', '7v7', '11v11'),
      allowNull: false,
    },
    pricePerHour: {
      type: DataTypes.DECIMAL(6, 2),
      allowNull: false,
    },
    // Every pitch has its own opening hours (a 24-hour indoor five-a-side
    // cage vs. a communal pitch that closes at 22:00) — bookings outside
    // [openTime, closeTime) are rejected the same way an overlapping
    // booking is (see bookingController.createBooking).
    openTime: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: '07:00:00',
    },
    closeTime: {
      type: DataTypes.TIME,
      allowNull: false,
      defaultValue: '23:00:00',
    },
    // JSON column holding an array of photo URLs, e.g. ["/uploads/a.jpg"].
    // A separate Photo table would be more "normalized" but is overkill
    // for what is just a list of strings with no independent behaviour.
    photos: {
      type: DataTypes.JSON,
      allowNull: false,
      defaultValue: [],
    },
    ownerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: 'Pitch',
    tableName: 'pitches',
  }
);

module.exports = Pitch;

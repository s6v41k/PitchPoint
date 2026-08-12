const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Booking extends Model {}

Booking.init(
  {
    pitchId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    // DATEONLY -> stored as 'YYYY-MM-DD', no time component.
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    // TIME columns ('HH:MM:SS') keep start/end simple to compare and to
    // render, and make the overlap query a plain string/time comparison.
    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('confirmed', 'cancelled'),
      allowNull: false,
      defaultValue: 'confirmed',
    },
  },
  {
    sequelize,
    modelName: 'Booking',
    tableName: 'bookings',
    validate: {
      // Model-level validation: runs on every create/update regardless of
      // which controller called it, so "endTime after startTime" can never
      // be bypassed by a future code path that forgets to check.
      endAfterStart() {
        if (this.startTime && this.endTime && this.endTime <= this.startTime) {
          throw new Error('endTime must be after startTime');
        }
      },
    },
  }
);

module.exports = Booking;

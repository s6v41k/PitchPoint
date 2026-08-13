const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

// A one-off exception to a pitch's normal weekly openTime/closeTime — e.g.
// maintenance on a specific afternoon, or closed for a public holiday.
// Checked by createBooking (bookingController.js) and by the frontend's
// availability grid alongside actual Bookings, but owner-managed
// separately from the recurring weekly hours on the Pitch itself.
class Closure extends Model {}

Closure.init(
  {
    pitchId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    startTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.TIME,
      allowNull: false,
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Closure',
    tableName: 'closures',
    validate: {
      endAfterStart() {
        if (this.startTime && this.endTime && this.endTime <= this.startTime) {
          throw new Error('endTime must be after startTime');
        }
      },
    },
  }
);

module.exports = Closure;

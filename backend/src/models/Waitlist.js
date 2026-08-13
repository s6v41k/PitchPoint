const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Waitlist extends Model {}

Waitlist.init(
  {
    pitchId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
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
  },
  {
    sequelize,
    modelName: 'Waitlist',
    tableName: 'waitlist_entries',
    indexes: [
      // One entry per user per exact slot — createBooking's cutting-in-
      // line rule already handles "already booked", this just stops the
      // same person joining the same waiting line twice.
      {
        name: 'waitlist_unique_entry',
        unique: true,
        fields: ['pitchId', 'userId', 'date', 'startTime', 'endTime'],
      },
    ],
  }
);

module.exports = Waitlist;

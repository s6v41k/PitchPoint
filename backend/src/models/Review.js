const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class Review extends Model {}

Review.init(
  {
    pitchId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: { min: 1, max: 5 },
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: 'Review',
    tableName: 'reviews',
    // One review per player per pitch: posting again (see
    // reviewController.upsertReview) updates it in place instead of
    // piling up duplicates. Named explicitly (see the comment on
    // User.email) so repeated `sync({ alter: true })` runs recognize
    // this exact index on later restarts instead of adding a new one
    // every time.
    indexes: [{ name: 'reviews_pitch_user_unique', unique: true, fields: ['pitchId', 'userId'] }],
  }
);

module.exports = Review;

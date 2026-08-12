const { DataTypes, Model } = require('sequelize');
const sequelize = require('../config/database');

class User extends Model {
  // Instance method — lets controllers do `user.toSafeJSON()` instead of
  // remembering every time to strip the password hash before sending a
  // user object back to the client.
  toSafeJSON() {
    const { id, name, email, role, emailVerified, createdAt } = this;
    return { id, name, email, role, emailVerified, createdAt };
  }
}

User.init(
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      // A *named* unique constraint, not just `unique: true`. Bare
      // `unique: true` lets Sequelize auto-name the index, and on MySQL
      // it doesn't recognize its own previous auto-generated name on the
      // next `sync({ alter: true })` — so it adds a brand new UNIQUE KEY
      // every single restart. Given how often this runs in dev, that
      // silently piled up 63 duplicate keys on this column over the
      // project's lifetime until MySQL's 64-key-per-table ceiling made
      // every further sync fail outright. A fixed name makes every sync
      // recognize the same constraint and leave it alone.
      unique: 'users_email_unique',
      validate: { isEmail: true },
    },
    // We never store the plaintext password — only the bcrypt hash.
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('player', 'owner'),
      allowNull: false,
      defaultValue: 'player',
    },
    // Purely informational — nothing in the app is gated on this being
    // true. It just lets the frontend show a "please verify your email"
    // nudge, without the friction (and support headaches) of blocking
    // login or booking for unverified accounts.
    emailVerified: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  {
    sequelize,
    modelName: 'User',
    tableName: 'users',
  }
);

module.exports = User;

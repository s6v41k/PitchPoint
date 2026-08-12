// Single Sequelize instance shared by every model in the app.
// Reading connection info from process.env means the same code runs
// against any MySQL server just by changing the .env file.
require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  dialect: 'mysql',
  logging: false, // set to console.log to see generated SQL while debugging
});

module.exports = sequelize;

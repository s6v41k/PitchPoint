const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 4000;

async function start() {
  try {
    await sequelize.authenticate();
    // `alter: true` lets Sequelize adjust existing tables to match the
    // models during development, without hand-writing migrations for a
    // student project. In a production app you'd use real migrations
    // instead (sequelize-cli) so schema changes are reviewable and safe.
    await sequelize.sync({ alter: true });
    console.log('Database connected and synced.');

    app.listen(PORT, () => {
      console.log(`PitchPoint API listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

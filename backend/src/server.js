const app = require('./app');
const { sequelize } = require('./models');
const { sendUpcomingReminders } = require('./utils/reminders');

const PORT = process.env.PORT || 4000;
const REMINDER_INTERVAL_MS = 60 * 60 * 1000;

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

    // Not fired immediately on boot — with nodemon restarting on every
    // save during development, an immediate run would re-scan on every
    // restart for no reason. reminderSent still guards against ever
    // double-sending; this just avoids the pointless extra checks.
    setInterval(() => {
      sendUpcomingReminders().catch((err) => console.error('[reminders] failed:', err));
    }, REMINDER_INTERVAL_MS);
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();

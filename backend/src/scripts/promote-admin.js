// One-off script to create the platform's first admin: registration can
// never produce an admin account (see authRoutes.js's role validator), so
// promoting an existing user this way — direct DB write, run once — is the
// simplest option. Run with: npm run promote-admin -- someone@example.com
require('dotenv').config();
const { sequelize, User } = require('../models');

async function promote() {
  const email = process.argv[2];
  if (!email) {
    console.error('Usage: npm run promote-admin -- someone@example.com');
    process.exitCode = 1;
    return;
  }

  const user = await User.findOne({ where: { email } });
  if (!user) {
    console.error(`No user found with email ${email}`);
    process.exitCode = 1;
    return;
  }

  user.role = 'admin';
  await user.save();
  console.log(`${user.email} is now an admin.`);
}

promote().finally(() => sequelize.close());

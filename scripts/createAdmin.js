/**
 * Creates (or updates the password of) an admin account, using values from
 * environment variables or command-line arguments.
 *
 * Usage:
 *   npm run create-admin
 *   node scripts/createAdmin.js --email you@example.com --password "S3curePass!" --name "Owner"
 */
require('dotenv').config();
const mongoose = require('mongoose');
const connectDatabase = require('../config/database');
const Admin = require('../models/Admin');

function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach((arg, i, arr) => {
    if (arg.startsWith('--')) {
      const key = arg.replace('--', '');
      args[key] = arr[i + 1];
    }
  });
  return args;
}

async function run() {
  const args = parseArgs();
  const email = (args.email || process.env.ADMIN_EMAIL || '').toLowerCase().trim();
  const password = args.password || process.env.ADMIN_PASSWORD;
  const name = args.name || process.env.ADMIN_NAME || 'Admin';

  if (!email || !password) {
    console.error('Missing email or password. Set ADMIN_EMAIL / ADMIN_PASSWORD in .env, or pass --email and --password.');
    process.exit(1);
  }

  if (password.length < 8) {
    console.error('Password must be at least 8 characters.');
    process.exit(1);
  }

  await connectDatabase();

  const passwordHash = await Admin.hashPassword(password);
  let admin = await Admin.findOne({ email });

  if (admin) {
    admin.passwordHash = passwordHash;
    admin.name = name;
    admin.active = true;
    await admin.save();
    console.log(`Updated existing admin account: ${email}`);
  } else {
    admin = await Admin.create({ name, email, passwordHash, role: 'superadmin' });
    console.log(`Created admin account: ${email}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error('Failed to create admin:', err);
  process.exit(1);
});

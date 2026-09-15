import '../config/loadEnv.js';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { ensurePlatformSuperadmin } from '../utils/ensureSuperadmin.js';

/**
 * One-shot: seed / sync the platform superadmin from env.
 * Usage:
 *   npm run seed:superadmin
 *   NODE_ENV=production npm run seed:superadmin
 */
const run = async () => {
  const isProduction = process.env.NODE_ENV === 'production';
  const loginUrl =
    process.env.SUPERADMIN_APP_URL?.replace(/\/$/, '') ||
    (isProduction ? 'https://superadmin.kabpro.pro' : 'http://localhost:3100');

  await connectDB();
  const result = await ensurePlatformSuperadmin();
  if (!result) {
    console.error(
      'Missing or invalid SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD. Add them to ' +
        (isProduction ? 'server/.env.production' : 'server/.env.development') +
        ' and retry.'
    );
    process.exit(1);
  }
  console.log('\nHow to login (Superadmin dashboard)');
  console.log('─────────────────────────────────');
  console.log(`  URL:      ${loginUrl}`);
  console.log(`  Email:    ${result.email}`);
  console.log(
    isProduction
      ? '  Password: (the SUPERADMIN_PASSWORD you set in .env.production)'
      : `  Password: ${result.password}`
  );
  console.log(`  Role:     ${result.role}`);
  console.log('');
  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});

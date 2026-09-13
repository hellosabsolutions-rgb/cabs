import '../config/loadEnv.js';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { ensurePlatformSuperadmin } from '../utils/ensureSuperadmin.js';

/**
 * One-shot: seed / sync the platform superadmin from env.
 * Usage:  npm run seed:superadmin
 */
const run = async () => {
  await connectDB();
  const result = await ensurePlatformSuperadmin();
  if (!result) {
    console.error(
      'Missing SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD. Add them to .env.development and retry.'
    );
    process.exit(1);
  }
  console.log('\nHow to login (Superadmin dashboard)');
  console.log('─────────────────────────────────');
  console.log(`  URL:      http://localhost:3100`);
  console.log(`  Email:    ${result.email}`);
  console.log(`  Password: ${result.password}`);
  console.log(`  Role:     ${result.role}`);
  console.log('');
  await mongoose.connection.close();
  process.exit(0);
};

run().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});

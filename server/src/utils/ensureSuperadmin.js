import { User } from '../models/User.js';

/**
 * Env-seeded platform superadmin (role: superadmin).
 *
 * Required (server .env.development / .env.production):
 *   SUPERADMIN_EMAIL
 *   SUPERADMIN_PASSWORD
 * Optional:
 *   SUPERADMIN_NAME
 *   SUPERADMIN_APP_URL
 *   SUPERADMIN_SYNC_PASSWORD=true  — reset password from env on every boot
 *     (auto-enabled when NODE_ENV !== production)
 */
function loginUrl() {
  return (
    process.env.SUPERADMIN_APP_URL?.replace(/\/$/, '') ||
    (process.env.NODE_ENV === 'production'
      ? 'https://superadmin.kabpro.pro'
      : 'http://localhost:3100')
  );
}

export async function ensurePlatformSuperadmin() {
  const email = process.env.SUPERADMIN_EMAIL?.trim()?.toLowerCase();
  const password = process.env.SUPERADMIN_PASSWORD;
  const name = process.env.SUPERADMIN_NAME?.trim() || 'KABPRO Superadmin';
  const isProduction = process.env.NODE_ENV === 'production';
  const syncPassword =
    process.env.SUPERADMIN_SYNC_PASSWORD === 'true' || !isProduction;

  if (!email || !password) {
    const existing = await User.countDocuments({ role: 'superadmin' });
    if (!existing) {
      console.warn(
        '⚠️  No superadmin yet. Set SUPERADMIN_EMAIL + SUPERADMIN_PASSWORD in ' +
          (isProduction ? 'server/.env.production' : 'server/.env.development')
      );
    }
    return null;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    console.warn('⚠️  SUPERADMIN_EMAIL is not a valid email. Superadmin not seeded.');
    return null;
  }

  if (String(password).length < 8) {
    console.warn(
      '⚠️  SUPERADMIN_PASSWORD must be at least 8 characters. Superadmin not seeded.'
    );
    return null;
  }

  let user = await User.findOne({ email }).select('+password');
  let action = 'exists';

  if (!user) {
    user = await User.create({
      name,
      email,
      password,
      role: 'superadmin',
      status: 'Active'
    });
    action = 'created';
  } else {
    let dirty = false;
    if (user.role !== 'superadmin') {
      user.role = 'superadmin';
      dirty = true;
      action = 'promoted';
    }
    if (user.status !== 'Active') {
      user.status = 'Active';
      dirty = true;
    }
    if (user.name !== name) {
      user.name = name;
      dirty = true;
    }
    if (syncPassword) {
      user.password = password;
      dirty = true;
      if (action === 'exists') action = 'synced';
    }
    if (dirty) {
      await user.save();
    }
  }

  const passwordNote =
    !isProduction && (syncPassword || action === 'created')
      ? `password=${password}`
      : 'password=(from env, not logged)';

  console.log(
    [`✅ Superadmin seed (${action})`, `role=superadmin`, `email=${email}`, passwordNote].join(
      ' · '
    )
  );
  console.log(`   → Login: ${loginUrl()}  ·  POST /api/superadmin/auth/login`);

  return { email, password, role: 'superadmin', name, action };
}

import { User } from '../models/User.js';

/**
 * Env-seeded platform superadmin (role: superadmin).
 *
 * Required:
 *   SUPERADMIN_EMAIL
 *   SUPERADMIN_PASSWORD
 * Optional:
 *   SUPERADMIN_NAME
 *   SUPERADMIN_SYNC_PASSWORD=true  — reset password from env on every boot
 *     (auto-enabled when NODE_ENV=development)
 */
export async function ensurePlatformSuperadmin() {
  const email = process.env.SUPERADMIN_EMAIL?.trim()?.toLowerCase();
  const password = process.env.SUPERADMIN_PASSWORD;
  const name = process.env.SUPERADMIN_NAME?.trim() || 'KABPRO Superadmin';
  const syncPassword =
    process.env.SUPERADMIN_SYNC_PASSWORD === 'true' ||
    process.env.NODE_ENV !== 'production';

  if (!email || !password) {
    const existing = await User.countDocuments({ role: 'superadmin' });
    if (!existing) {
      console.warn(
        '⚠️  No superadmin yet. Set SUPERADMIN_EMAIL + SUPERADMIN_PASSWORD in server .env'
      );
    }
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

  const line = [
    `✅ Superadmin seed (${action})`,
    `role=superadmin`,
    `email=${email}`,
    syncPassword || action === 'created' ? `password=${password}` : 'password=(unchanged)'
  ].join(' · ');
  console.log(line);
  console.log(`   → Login: http://localhost:3100  ·  POST /api/superadmin/auth/login`);

  return { email, password, role: 'superadmin', name, action };
}

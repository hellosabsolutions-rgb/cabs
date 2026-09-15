# KABPRO Superadmin

Platform console: login, organization onboard, project tracking, admin-user management.

## Environments

| Mode | Frontend env | API env | Login |
|------|----------------|---------|--------|
| Development | `superadmin/.env.development` | `server/.env.development` | `superadmin@kabpro.com` / `SuperAdmin@123` |
| Production | `superadmin/.env.production` (public URLs) | `server/.env.production` **SUPERADMIN_EMAIL / SUPERADMIN_PASSWORD** | whatever you set on the server |

Production login secrets are **never** baked into the SPA. Put them only in `server/.env.production`. On API boot the user is created with `role=superadmin`.

## Development

```bash
cd server && npm run dev
cd superadmin && npm install && npm run dev
```

UI: http://localhost:3100

Dev credentials (from `server/.env.development`, also shown on the login page):
- Email: `superadmin@kabpro.com`
- Password: `SuperAdmin@123`
- Role: `superadmin`

Re-seed / reset password from env:

```bash
cd server && npm run seed:superadmin
```

## Production login (THANOS)

On the server, edit `/srv/apps/cabs/server/.env.production`:

```env
SUPERADMIN_EMAIL=you@company.com
SUPERADMIN_PASSWORD=your-strong-password
SUPERADMIN_NAME=KABPRO Superadmin
SUPERADMIN_APP_URL=https://superadmin.kabpro.pro
```

Then restart:

```bash
pm2 restart kabpro-api --update-env
```

If the account already exists and you only changed the password, also set `SUPERADMIN_SYNC_PASSWORD=true` once, restart, then you can remove that flag.

Login URL: https://superadmin.kabpro.pro

## Key APIs

- `POST /api/superadmin/auth/login`
- `POST /api/superadmin/organizations/onboard` — org + admin user + agency + project
- `GET /api/superadmin/dashboard|organizations|projects|users`
- `PATCH` lifecycle on orgs / projects / users

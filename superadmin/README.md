# KABPRO Superadmin

Platform console: login, organization onboard, project tracking, admin-user management.

## Run

```bash
cd server && npm run dev
cd superadmin && npm install && npm run dev
```

UI: http://localhost:3100

Dev superadmin (from `server/.env.development`):
- `superadmin@kabpro.com` / `SuperAdmin@123`

## Key APIs

- `POST /api/superadmin/auth/login`
- `POST /api/superadmin/organizations/onboard` — org + admin user + agency + project
- `GET /api/superadmin/dashboard|organizations|projects|users`
- `PATCH` lifecycle on orgs / projects / users

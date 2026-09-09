# FleetOS / KABPRO Backend

Node.js + Express + MongoDB API for the KABPRO fleet admin.

## Getting started (local)

1. Node.js 18+ and MongoDB local (or Atlas).
2. Copy env: edit `server/.env.development` (already in repo for local).
3. Install & run:

```bash
cd server
npm install
npm run dev
```

API: **http://localhost:5000** · Health: `/api/health`

There is **no seed / dummy data**. Start with an empty DB and create your admin via Google Sign-In or registration.

Production deploy: **`server/docs/DEPLOYMENT.md`**

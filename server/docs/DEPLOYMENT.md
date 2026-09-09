# KABPRO — THANOS production deploy & update

**Domains (opsiva.in):**

| App | URL | Process / path |
|-----|-----|----------------|
| API | `https://api-kabpro.opsiva.in` | PM2 `kabpro-api` · port **5002** |
| Admin | `https://admin-kabpro.opsiva.in` | Static `admin/dist` via nginx |
| Landing | `https://kabpro.opsiva.in` | Separate (not in this CI) |

Repo root on server: **`/srv/apps/cabs`**

---

## A. One-time server setup (first deploy only)

### 1. Secrets — `server/.env.production` (never commit)

```bash
cd /srv/apps/cabs/server
cp .env.production.example .env.production
nano .env.production
chmod 600 .env.production
```

Fill at least:

```env
NODE_ENV=production
PORT=5002

MONGO_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/kabpro?retryWrites=true&w=majority

CORS_ORIGINS=https://admin-kabpro.opsiva.in,https://kabpro.opsiva.in
CLIENT_URL=https://admin-kabpro.opsiva.in
PUBLIC_API_URL=https://api-kabpro.opsiva.in

JWT_SECRET=<long-random-32+-chars>
ACCESS_TOKEN_EXPIRE=15m

GOOGLE_CLIENT_ID=546992458715-dbhmfbb7bj36h6sfm2m4l8qjisdmd491.apps.googleusercontent.com

CLOUDINARY_CLOUD_NAME=<your-cloud>
CLOUDINARY_API_KEY=<your-key>
CLOUDINARY_API_SECRET=<your-secret>

# Firebase Admin JSON (copy file to server; gitignored)
FIREBASE_SERVICE_ACCOUNT_FILE=opsiva-e1ee5-firebase-adminsdk-fbsvc-0a08b2b878.json
# or absolute:
# FIREBASE_SERVICE_ACCOUNT_PATH=/srv/apps/cabs/server/opsiva-e1ee5-firebase-adminsdk-fbsvc-0a08b2b878.json
```

### 2. Firebase Admin JSON on THANOS

```bash
# From your laptop (example) — do NOT commit this file
scp server/opsiva-e1ee5-firebase-adminsdk-fbsvc-0a08b2b878.json \
  user@thanos:/srv/apps/cabs/server/
chmod 600 /srv/apps/cabs/server/opsiva-e1ee5-firebase-adminsdk-*.json
```

### 3. nginx

```bash
sudo cp /srv/apps/cabs/scripts/thanos/nginx-kabpro-production.conf \
  /etc/nginx/sites-available/kabpro-production
sudo ln -sf /etc/nginx/sites-available/kabpro-production /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 4. Cloudflare Tunnel hostnames

| Subdomain | Service |
|-----------|---------|
| `api-kabpro` | `http://127.0.0.1:80` |
| `admin-kabpro` | `http://127.0.0.1:80` |
| `kabpro` | `http://127.0.0.1:80` |

SSL: **Full (strict)** · Always HTTPS on.

### 5. First PM2 start (if not via CI yet)

```bash
cd /srv/apps/cabs/server
npm ci --omit=dev
NODE_ENV=production pm2 start src/server.js --name kabpro-api --cwd /srv/apps/cabs/server
pm2 save
pm2 logs kabpro-api --lines 40
```

Expect the **KABPRO** banner with green Firebase + Cloudinary + MongoDB.

---

## B. Normal update (what to do after code changes)

### Preferred: push to `main` (CI)

1. Push/merge to **`main`** (paths under `admin/**`, `server/**`, or workflow).
2. Self-hosted runner on THANOS runs **Deploy production**:
   - builds admin with production `VITE_*`
   - rsyncs `admin/dist` + `server/` to `/srv/apps/cabs`
   - `npm ci --omit=dev` in server
   - `pm2 restart kabpro-api --update-env`
   - health smoke on port **5002**

**You do not need to seed anything.** No dummy data is deployed.

### After CI, verify on THANOS

```bash
pm2 status
pm2 logs kabpro-api --lines 50 --nostream

# Expect banner: Firebase ready · Cloudinary ok · MongoDB connected
curl -sS http://127.0.0.1:5002/api/health
curl -sS -H "Host: api-kabpro.opsiva.in" http://127.0.0.1/api/health
curl -sS -o /dev/null -w "%{http_code}\n" -H "Host: admin-kabpro.opsiva.in" http://127.0.0.1/
```

### Manual update (if CI skipped)

```bash
cd /srv/apps/cabs
git fetch origin && git checkout main && git pull origin main

# Admin
cd /srv/apps/cabs/admin
npm ci --include=dev
npm run build   # uses admin/.env.production

# Server deps
cd /srv/apps/cabs/server
npm ci --omit=dev
NODE_ENV=production pm2 restart kabpro-api --update-env
# or first time:
# NODE_ENV=production pm2 start src/server.js --name kabpro-api --cwd /srv/apps/cabs/server
pm2 save
```

### When you change **env / secrets** only

```bash
nano /srv/apps/cabs/server/.env.production
# keep Firebase JSON file in place
NODE_ENV=production pm2 restart kabpro-api --update-env
pm2 logs kabpro-api --lines 30
```

### When you rotate Firebase service account

1. Copy new `*firebase-adminsdk*.json` into `/srv/apps/cabs/server/`
2. Update `FIREBASE_SERVICE_ACCOUNT_FILE` (or `PATH`) in `.env.production`
3. `pm2 restart kabpro-api --update-env`

### When you change Cloudinary / Google client

1. Update `.env.production` (`CLOUDINARY_*`, `GOOGLE_CLIENT_ID`)
2. If Google client ID changes, also update `admin/.env.production` → `VITE_GOOGLE_CLIENT_ID` and **rebuild admin** (push to main or manual build)
3. Restart API

---

## C. Checklist — what must exist on THANOS after this update

| Item | Required |
|------|----------|
| `/srv/apps/cabs/server/.env.production` | Yes — Mongo, JWT, CORS, Cloudinary, Google, Firebase path |
| Firebase Admin JSON in `server/` | Yes — for FCM push |
| `admin/dist` built with prod URLs | Yes — CI or manual |
| PM2 `kabpro-api` on **5002** | Yes |
| nginx `kabpro-production` | Yes |
| Cloudflare tunnel hostnames | Yes |
| Seed / dummy DB data | **No** — removed from codebase |
| `npm run seed` | **Removed** — do not run |

---

## D. CORS / smoke checks

```bash
curl -sI -X OPTIONS https://api-kabpro.opsiva.in/api/auth/isLogin \
  -H "Origin: https://admin-kabpro.opsiva.in" \
  -H "Access-Control-Request-Method: GET" | grep -i access-control

curl -sS https://api-kabpro.opsiva.in/api/health
```

---

## E. Notes

- Auth is **Bearer JWT** (localStorage), not shared cookies across opsiva apps.
- Admin public Firebase web keys live in committed `admin/.env.production` (client-safe).
- Server service-account JSON and Cloudinary secret stay **only** on THANOS.
- Empty production DB is expected until real users/agencies are created in the admin UI.

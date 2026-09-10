# KABPRO — THANOS production deploy & update

**Primary domains (`kabpro.pro`):**

| App | URL | Process / path |
|-----|-----|----------------|
| API | `https://api.kabpro.pro` | PM2 `kabpro-api` · port **5002** |
| Admin | `https://admin.kabpro.pro` | Static `admin/dist` via nginx |
| Landing | `https://kabpro.pro` | PM2 landing · port **3001** |

Repo root on server: **`/srv/apps/cabs`**

> **Domain / tunnel cutover:** see **[`DOMAIN-KABPRO-PRO.md`](./DOMAIN-KABPRO-PRO.md)** (reuse existing Cloudflare tunnel — do not create a second one unless required).

Legacy `*.opsiva.in` is still accepted in nginx + CORS during migration.

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

CORS_ORIGINS=https://admin.kabpro.pro,https://kabpro.pro,https://www.kabpro.pro,https://admin-kabpro.opsiva.in,https://kabpro.opsiva.in
CLIENT_URL=https://admin.kabpro.pro
PUBLIC_API_URL=https://api.kabpro.pro

JWT_SECRET=<long-random-32+-chars>
ACCESS_TOKEN_EXPIRE=15m

GOOGLE_CLIENT_ID=546992458715-dbhmfbb7bj36h6sfm2m4l8qjisdmd491.apps.googleusercontent.com

CLOUDINARY_CLOUD_NAME=<your-cloud>
CLOUDINARY_API_KEY=<your-key>
CLOUDINARY_API_SECRET=<your-secret>

FIREBASE_SERVICE_ACCOUNT_FILE=opsiva-e1ee5-firebase-adminsdk-fbsvc-0a08b2b878.json
```

### 2. Firebase Admin JSON on THANOS

```bash
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

### 4. Cloudflare Tunnel

Reuse the **existing** THANOS tunnel. Add public hostnames → `http://127.0.0.1:80` for:

- `api.kabpro.pro`
- `admin.kabpro.pro`
- `kabpro.pro`
- `www.kabpro.pro`

Full steps: **`DOMAIN-KABPRO-PRO.md`**.

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

## B. Normal update (after code changes)

### Preferred: push to `main` (CI)

1. Push/merge to **`main`**.
2. Runner builds admin with `VITE_*` for `*.kabpro.pro`, publishes to `/srv/apps/cabs`, restarts `kabpro-api`.

### Verify

```bash
pm2 logs kabpro-api --lines 50 --nostream
curl -sS http://127.0.0.1:5002/api/health
curl -sS -H "Host: api.kabpro.pro" http://127.0.0.1/api/health
curl -sS -o /dev/null -w "%{http_code}\n" -H "Host: admin.kabpro.pro" http://127.0.0.1/
```

### Env-only change

```bash
nano /srv/apps/cabs/server/.env.production
pm2 restart kabpro-api --update-env
```

---

## C. CORS / smoke

```bash
curl -sI -X OPTIONS https://api.kabpro.pro/api/auth/isLogin \
  -H "Origin: https://admin.kabpro.pro" \
  -H "Access-Control-Request-Method: GET" | grep -i access-control

curl -sS https://api.kabpro.pro/api/health
```

---

## D. Notes

- Auth is **Bearer JWT** (localStorage).
- Do **not** set a shared `CF_COOKIE_DOMAIN` across unrelated Opsiva apps.
- Empty DB is expected until real agencies/users are created (seed scripts removed).

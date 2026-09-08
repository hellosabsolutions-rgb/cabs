# KABPRO — THANOS production deployment

**Domains (opsiva.in — hyphen first-level, Cloudflare Universal SSL):**

| App | URL |
|-----|-----|
| API | `https://api-kabpro.opsiva.in` |
| Admin | `https://admin-kabpro.opsiva.in` |
| Landing | `https://kabpro.opsiva.in` |

---

## 1. Server `.env.production` (THANOS — secrets, never commit)

Create on server:

```bash
cp /srv/apps/cabs/server/.env.production.example /srv/apps/cabs/server/.env.production
nano /srv/apps/cabs/server/.env.production
chmod 600 /srv/apps/cabs/server/.env.production
```

**Full file:**

> **THANOS port:** Opsiva BACKEND uses 5000–5005 and 8080. KABPRO API uses **5002** — must match `scripts/thanos/nginx-kabpro-production.conf` (`proxy_pass`).

```env
NODE_ENV=production
PORT=5002

MONGO_URI=mongodb+srv://USER:PASSWORD@cluster.mongodb.net/kabpro?retryWrites=true&w=majority

CORS_ORIGINS=https://admin-kabpro.opsiva.in,https://kabpro.opsiva.in
CLIENT_URL=https://admin-kabpro.opsiva.in
PUBLIC_API_URL=https://api-kabpro.opsiva.in

JWT_SECRET=your-long-random-secret-min-32-chars
ACCESS_TOKEN_EXPIRE=15m
```

After edit:

```bash
pm2 restart kabpro-api --update-env
pm2 logs kabpro-api --lines 10
# Expect: CORS origins: https://admin-kabpro.opsiva.in, https://kabpro.opsiva.in
```

---

## 2. Admin `.env.production` (committed — public URLs)

Already in repo at `admin/.env.production`:

```env
VITE_API_URL=https://api-kabpro.opsiva.in/api
VITE_SOCKET_URL=https://api-kabpro.opsiva.in
VITE_APP_URL=https://admin-kabpro.opsiva.in
VITE_LANDING_URL=https://kabpro.opsiva.in
```

CI bakes these on every build. Local prod build: `cd admin && npm run build`.

---

## 3. Landing `.env.production`

```env
NEXT_PUBLIC_SITE_URL=https://kabpro.opsiva.in
NEXT_PUBLIC_API_URL=https://api-kabpro.opsiva.in/api
NEXT_PUBLIC_ADMIN_URL=https://admin-kabpro.opsiva.in
```

Deploy landing separately (PM2 on THANOS port 3001 or Vercel with same env vars).

```bash
cd /srv/apps/cabs/landing
npm ci && npm run build
NODE_ENV=production pm2 start npm --name kabpro-landing -- start
pm2 save
```

---

## 4. CORS verification

```bash
# Admin origin — must return Access-Control-Allow-Origin
curl -sI -X OPTIONS https://api-kabpro.opsiva.in/api/auth/isLogin \
  -H "Origin: https://admin-kabpro.opsiva.in" \
  -H "Access-Control-Request-Method: GET" | grep -i access-control

# Landing origin
curl -sI -X OPTIONS https://api-kabpro.opsiva.in/api/health \
  -H "Origin: https://kabpro.opsiva.in" \
  -H "Access-Control-Request-Method: GET" | grep -i access-control

# Blocked origin — should NOT echo random domain
curl -sI -X OPTIONS https://api-kabpro.opsiva.in/api/health \
  -H "Origin: https://evil.example.com" \
  -H "Access-Control-Request-Method: GET" | grep -i access-control-allow-origin
```

---

## 5. nginx (all three hostnames → 127.0.0.1:80)

```bash
sudo cp /srv/apps/cabs/scripts/thanos/nginx-kabpro-production.conf \
  /etc/nginx/sites-available/kabpro-production
sudo ln -sf /etc/nginx/sites-available/kabpro-production /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Local test:

```bash
curl -sS -H "Host: api-kabpro.opsiva.in" http://127.0.0.1/api/health
curl -sS -H "Host: admin-kabpro.opsiva.in" http://127.0.0.1/ | head -3
curl -sS -o /dev/null -w "%{http_code}\n" -H "Host: kabpro.opsiva.in" http://127.0.0.1/
```

---

## 6. Cloudflare Tunnel public hostnames

Zero Trust → Tunnels → add:

| Subdomain | Service |
|-----------|---------|
| `api-kabpro` | `http://127.0.0.1:80` |
| `admin-kabpro` | `http://127.0.0.1:80` |
| `kabpro` | `http://127.0.0.1:80` |

DNS must be **Tunnel / Proxied** (not A record to old EC2).

SSL: **Full (strict)**, **Always Use HTTPS** on.

---

## 7. CI/CD (admin + server)

Push to `main` → self-hosted runner builds admin with production URLs → publishes to `/srv/apps/cabs` → `pm2 restart kabpro-api`.

Landing is **not** in CI — deploy manually or add later.

---

## Cookie notes

- Auth uses **Bearer JWT** in localStorage (not cross-domain cookies).
- Do **not** set `CF_COOKIE_DOMAIN=.opsiva.in` — conflicts with other Opsiva apps.
- Socket.IO uses same CORS list as REST API.

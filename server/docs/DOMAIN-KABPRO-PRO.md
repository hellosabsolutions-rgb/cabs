# KABPRO domain cutover — `kabpro.pro`

Landing is already on **kabpro.pro**. This guide wires **API + Admin** on the same Cloudflare account / THANOS host.

## Target hostnames

| App | URL | Local service |
|-----|-----|----------------|
| Landing | `https://kabpro.pro` (+ `www`) | nginx → `127.0.0.1:3001` |
| Admin | `https://admin.kabpro.pro` | nginx → `/srv/apps/cabs/admin/dist` |
| API + Socket.IO | `https://api.kabpro.pro` | nginx → `127.0.0.1:5002` |

Legacy `*.opsiva.in` can stay live during cutover (nginx + CORS already accept both).

---

## 1. Tunnel: reuse existing — do **not** create a new one

You already run cloudflared for `opsiva.in` on THANOS. **One tunnel can publish many domains.**

Creating a second tunnel means:

- second connector / credentials
- second systemd service or dashboard connector
- more failure points

**Do this instead:** add `kabpro.pro` public hostnames to the **same** tunnel.

### Option A — Cloudflare Zero Trust UI (easiest)

1. Cloudflare Dashboard → **Zero Trust** → **Networks** → **Tunnels**
2. Open your **existing** THANOS / opsiva tunnel
3. **Configure** → **Published application routes** (Public Hostname) → **Add**:

| Subdomain | Domain | Service |
|-----------|--------|---------|
| `api` | `kabpro.pro` | `http://127.0.0.1:80` |
| `admin` | `kabpro.pro` | `http://127.0.0.1:80` |
| *(empty = apex)* | `kabpro.pro` | `http://127.0.0.1:80` |
| `www` | `kabpro.pro` | `http://127.0.0.1:80` |

All point to **nginx on port 80** (not directly to 5002/3001). nginx routes by `Host`.

4. Save. Cloudflare creates DNS CNAME → tunnel automatically when the zone uses Cloudflare nameservers.

### Option B — edit `/etc/cloudflared/config.yml` on THANOS (or use helper script)

Repo files:

- Full template: `scripts/thanos/cloudflared-config.example.yml`
- Apply helper (merge hostnames + validate + restart):

```bash
# After git pull on THANOS / or from CI-published tree:
sudo bash /srv/apps/cabs/scripts/thanos/apply-cloudflared-kabpro.sh --dry-run
sudo bash /srv/apps/cabs/scripts/thanos/apply-cloudflared-kabpro.sh
```

Manual merge:

```bash
sudo cp /etc/cloudflared/config.yml /etc/cloudflared/backups/config.yml.$(date +%Y%m%d-%H%M%S)
sudo nano /etc/cloudflared/config.yml
# add api.kabpro.pro / admin.kabpro.pro / kabpro.pro / www.kabpro.pro → http://127.0.0.1:80
# KEEP your existing opsiva / other hostnames
# catch-all "service: http_status:404" must stay LAST

sudo cloudflared tunnel ingress validate --config /etc/cloudflared/config.yml
sudo systemctl restart cloudflared
sudo systemctl status cloudflared --no-pager
```

### Only create a **new** tunnel if

- `kabpro.pro` must live on a **different** machine, or
- you want a completely separate connector for isolation

Then: Zero Trust → Create tunnel → install connector on that host → add the same 4 public hostnames → still use `http://127.0.0.1:80`.

---

## 2. DNS (Cloudflare zone `kabpro.pro`)

Nameservers already on Cloudflare. Confirm DNS:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| CNAME | `api` | `<tunnel-id>.cfargotunnel.com` | Proxied (orange) |
| CNAME | `admin` | `<tunnel-id>.cfargotunnel.com` | Proxied |
| CNAME | `@` or A/AAAA via tunnel | tunnel route for apex | Proxied |
| CNAME | `www` | `<tunnel-id>.cfargotunnel.com` | Proxied |

UI “Public Hostname” usually creates these for you.

SSL/TLS mode: **Full (strict)** · Always Use HTTPS: **On**.

---

## 3. nginx on THANOS

```bash
sudo cp /srv/apps/cabs/scripts/thanos/nginx-kabpro-production.conf \
  /etc/nginx/sites-available/kabpro-production
sudo ln -sf /etc/nginx/sites-available/kabpro-production /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Local checks (before public DNS matters):

```bash
curl -sS -H "Host: api.kabpro.pro" http://127.0.0.1/api/health
curl -sS -o /dev/null -w "%{http_code}\n" -H "Host: admin.kabpro.pro" http://127.0.0.1/
curl -sS -o /dev/null -w "%{http_code}\n" -H "Host: kabpro.pro" http://127.0.0.1/
```

---

## 4. Server `.env.production` (CORS + public URLs)

Edit on THANOS (file is gitignored):

```bash
nano /srv/apps/cabs/server/.env.production
```

Set / merge:

```env
CORS_ORIGINS=https://admin.kabpro.pro,https://kabpro.pro,https://www.kabpro.pro,https://admin-kabpro.opsiva.in,https://kabpro.opsiva.in
CLIENT_URL=https://admin.kabpro.pro
PUBLIC_API_URL=https://api.kabpro.pro
```

Then:

```bash
cd /srv/apps/cabs/server
pm2 restart kabpro-api --update-env
pm2 logs kabpro-api --lines 30 --nostream
```

Expect CORS list to include `https://admin.kabpro.pro` and `https://kabpro.pro`.

---

## 5. Admin + landing rebuild (baked URLs)

Repo already points production env at `*.kabpro.pro`. After push to `main`, CI rebuilds admin.

Or manually:

```bash
cd /srv/apps/cabs/admin
npm ci --include=dev && npm run build

cd /srv/apps/cabs/landing
# update .env.production then:
npm ci && npm run build
pm2 restart kabpro-landing   # or your landing process name
```

Landing env:

```env
NEXT_PUBLIC_SITE_URL=https://kabpro.pro
NEXT_PUBLIC_API_URL=https://api.kabpro.pro/api
NEXT_PUBLIC_ADMIN_URL=https://admin.kabpro.pro
```

---

## 6. Google Sign-In (required for admin login)

[Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → your OAuth **Web** client:

**Authorized JavaScript origins**

- `https://admin.kabpro.pro`
- `http://localhost:3000` (dev)

**Authorized redirect URIs** (if used)

- `https://admin.kabpro.pro`
- `http://localhost:3000`

Save. Wait a few minutes.

---

## 7. Firebase authorized domains (push / auth web)

Firebase Console → Authentication → Settings → **Authorized domains** → add:

- `kabpro.pro`
- `admin.kabpro.pro`

---

## 8. Verify end-to-end

```bash
curl -sS https://api.kabpro.pro/api/health

curl -sI -X OPTIONS https://api.kabpro.pro/api/auth/isLogin \
  -H "Origin: https://admin.kabpro.pro" \
  -H "Access-Control-Request-Method: GET" | grep -i access-control

curl -sS -o /dev/null -w "%{http_code}\n" https://admin.kabpro.pro/
curl -sS -o /dev/null -w "%{http_code}\n" https://kabpro.pro/
```

Browser:

1. Open `https://admin.kabpro.pro` → hard refresh (`Ctrl+Shift+R`)
2. Google login works
3. Dashboard API calls succeed (Network tab → `api.kabpro.pro`)

---

## 9. Checklist order

1. nginx updated + reload  
2. Add public hostnames on **existing** tunnel (or merge config + restart cloudflared)  
3. Confirm DNS Proxied for `api` / `admin` / `@` / `www`  
4. Update `/srv/apps/cabs/server/.env.production` CORS + `pm2 restart --update-env`  
5. Deploy/rebuild admin (CI or manual) + landing env  
6. Google OAuth + Firebase authorized domains  
7. Smoke curls + browser login  

---

## 10. After cutover is stable

Remove legacy from CORS / nginx / tunnel when you no longer need `*.opsiva.in`:

- Drop `admin-kabpro.opsiva.in` / `api-kabpro.opsiva.in` / `kabpro.opsiva.in` from nginx `server_name`
- Drop them from `CORS_ORIGINS`
- Delete those public hostnames from the tunnel

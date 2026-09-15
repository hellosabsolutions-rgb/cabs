# KABPRO Superadmin Platform Guide

**Audience:** Platform operators, engineering  
**App:** Superadmin console (`superadmin/`)  
**Production URL:** https://superadmin.kabpro.pro  
**Local URL:** http://localhost:3100  

---

## 1. Purpose

Superadmin is the **platform control plane** for KABPRO — not a fleet tenant app.

It manages:
- Organizations (customers) and projects
- Onboarding new fleet admins
- Leads, funnel, and admin login/return tracking
- Subscription **plans** (country-based catalog)
- Subscription **assignments** and trials
- Platform activity events
- Reports / exports (Excel, PDF, Word)

Fleet day-to-day ops stay in **Admin** (`admin.kabpro.pro`).

---

## 2. Access & security

### Login
- Email + password against API `/api/superadmin/auth/login`
- Role required: `superadmin`
- Session stored in `sessionStorage` (tab-scoped)

### Dev bootstrap
Configured in `server/.env.development` (example):

```env
SUPERADMIN_EMAIL=superadmin@kabpro.com
SUPERADMIN_PASSWORD=SuperAdmin@123
SUPERADMIN_NAME=KABPRO Superadmin
SUPERADMIN_SYNC_PASSWORD=true
SUPERADMIN_APP_URL=http://localhost:3100
```

On API boot, `ensureSuperadmin` creates or (in development) re-syncs the password.  
Demo credentials on the login UI appear **only** when `import.meta.env.DEV && MODE === 'development'`.

### Production
Set `SUPERADMIN_EMAIL` / `SUPERADMIN_PASSWORD` / `SUPERADMIN_APP_URL` in `server/.env.production`.  
Never commit real secrets. See `server/docs/DEPLOYMENT.md`.

### Auto logout
- Any Superadmin API response `401` or `403` (except login) clears session, disconnects socket, and forces logout
- Applies to JSON calls and binary exports (`apiFetch` / `apiFetchBlob`)

### CORS
API must allow `https://superadmin.kabpro.pro` (and `http://localhost:3100` in development).

---

## 3. Navigation / pages

| Page | Role |
|------|------|
| Overview / Board | Live KPIs, recent platform events, socket toasts |
| Organizations | List / inspect onboarded orgs |
| Projects | Platform projects linked to orgs / agencies |
| Users | Platform-visible users |
| Onboard | Create org + primary admin + agency + project + auto Trial |
| Leads | CRM-style inbound leads + funnel stats + Export |
| Plans & subscriptions | Full plan CRUD, seed markets, assign trials, status patches |
| Reports | Dataset filters + single Export menu (xlsx / pdf / doc) |

---

## 4. Organizations & onboard

### Onboard flow (high level)
1. Superadmin submits org + primary admin details  
2. Server creates:
   - `Organization`
   - Admin `User` (fleet role)
   - `Agency`
   - `Project`
3. Auto-starts **Trial** `OrganizationSubscription` on market STARTER (or fallback plan)
4. Emits platform event `org_onboard`

### Tracking
Fleet Admin logins emit `admin_login` / `admin_return` (skipped for pure `superadmin` accounts).

---

## 5. Leads & funnel

### Lead fields
Company, contact, email, phone, city, source, status, notes, interested plan, linked organization

### Statuses
`New` · `Contacted` · `Qualified` · `Trial` · `Won` · `Lost`

### Funnel metrics
- Admin logins  
- Return visits  
- Org onboards  
- Active trials  
- Leads by status  

### UI pattern
- **New lead** (primary, left)  
- **Export** (right) — opens options card (format + filters), not multiple format buttons  

---

## 6. Plans & subscriptions

### Plan model (catalog)
Fully managed per country:

| Field group | Contents |
|-------------|----------|
| Identity | name, code, category (Free/Starter/Professional/Growth/Enterprise/Custom) |
| Copy | description, benefits[{title, detail}], legacy features[] |
| Market | country (ISO), countryName, currency |
| Pricing | priceMonthly, priceYearly, pricingLabel |
| Trial | trialDays |
| Quotas | limits.vehicles / drivers / users |
| Ops | featured, isActive, sortOrder |

Unique: `(code + country)`.

### Superadmin UI capabilities
- Create / edit / delete plans  
- Filter by country and category  
- Seed default markets (IN / AE / US × Starter→Enterprise)  
- Assign organization → plan (start trial toggle)  
- Patch subscription status (e.g. Activate, End)  

### Important
- Assignments are **Superadmin-only** today  
- Plans are **not yet enforced** in fleet Admin  
- Next: machine feature keys + Admin billing page (see **02-PLAN-ENTITLEMENTS-BLUEPRINT**)

---

## 7. Reports & export

### Datasets
- Organizations  
- Leads  
- Activity / events  
- Subscriptions  
- Plans catalog  

### Filters
- Date from / to  
- Status / type  
- Country (plans / subscriptions)  
- Search (leads / orgs)  

### Download UX
- **One Export button** → options card  
- Choose file format: Excel (`.xlsx`), PDF (`.pdf`), Word (`.doc`)  
- Download applies current filters  

### API
`GET /api/superadmin/export?kind=&format=&from=&to=&status=&country=&search=`

---

## 8. Realtime

- Superadmin sockets join room `superadmin`
- Platform events emit to that room
- Board page shows live toasts for onboard / lead / subscription activity

---

## 9. API surface (prefix `/api/superadmin`)

| Area | Examples |
|------|----------|
| Auth | `POST /auth/login`, session verify |
| Orgs / projects / users | list, detail, onboard |
| Leads | CRUD, convert, funnel |
| Events | list platform events |
| Plans | list, upsert, delete, seed-defaults |
| Subscriptions | list, assign, patch status |
| Export | filtered binary download |

All mutating/list routes require authenticated `superadmin` role.

---

## 10. Deploy checklist

1. Build `superadmin` with production `VITE_API_URL` / `VITE_SOCKET_URL` / `VITE_APP_URL`  
2. Publish `superadmin/dist` to `/srv/apps/cabs/superadmin/dist`  
3. Nginx `server_name superadmin.kabpro.pro` → that dist  
4. Cloudflare Tunnel hostname `superadmin.kabpro.pro` → `http://127.0.0.1:80`  
5. API CORS includes `https://superadmin.kabpro.pro`  
6. Set `SUPERADMIN_*` env on API and restart PM2  

CI workflow builds admin + superadmin on push to `main` when paths change.

---

## 11. Related documents

- **01-ADMIN-FEATURES** — what fleet tenants get  
- **02-PLAN-ENTITLEMENTS-BLUEPRINT** — packaging & enforcement roadmap  
- **04-SUBSCRIPTION-DATA-MODEL** — schemas & APIs  
- `server/docs/DEPLOYMENT.md` — THANOS production ops  

---

*End of Superadmin Platform Guide*

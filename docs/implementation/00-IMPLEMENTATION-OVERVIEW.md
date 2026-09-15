# 00 — Implementation overview

**Goal:** One subscription catalog drives Landing prices, Admin module access, and Server API enforcement.

---

## 1. System diagram

```
                    ┌─────────────────────┐
                    │     Superadmin      │
                    │  edit plans / trial │
                    └──────────┬──────────┘
                               │ CRUD
                               v
┌──────────────┐      ┌────────────────────┐      ┌─────────────────┐
│   Landing    │─────▶│       Server       │◀─────│  Admin dashboard│
│ public price │ GET  │ SubscriptionPlan   │ GET  │  /billing/me    │
│ + inquiry    │ POST │ OrgSubscription    │ +    │  can(feature)   │
└──────────────┘ lead │ resolveEntitlements│ MW   └─────────────────┘
                      │ requireEntitlement │
                      └────────────────────┘
```

---

## 2. What each app consumes

| App | Reads | Writes | Must never |
|-----|-------|--------|------------|
| **Landing** | Active plans for a country (name, price, benefits, CTA) | Inquiry / lead | Decide feature access |
| **Admin** | Resolved entitlements + usage + trial | Upgrade request | Bypass API with UI-only unlocks |
| **Server** | Org + plan + overrides | Enforce quotas / features | Trust body flags like `skipLimit` |
| **Superadmin** | Full catalog + all orgs | Plans, assign trial, overrides | Soft-delete plans still in use |

---

## 3. Data that travels

### Catalog row (marketing + packaging)
- Identity: name, code, category  
- Market: country, currency, prices  
- Benefits: human bullets for Landing / Admin billing page  
- Entitlements: machine keys for Admin + Server  
- Limits: vehicles, drivers, users, agencies  
- Trial: `trialDays` (+ optional trial key subset)

### Resolved payload for Admin (`GET /api/billing/me`)
- `subscription.status`, `trialEndsAt`, `daysLeft`  
- `plan` summary + `benefits`  
- `features` map `{ [key]: true|false|number }`  
- `limits` + `usage`

### Public payload for Landing (`GET /api/public/plans?country=IN`)
- Active plans only  
- name, description, prices, benefits, featured, trialDays  
- **No** internal entitlement keys required (optional summary labels ok)

---

## 4. Implementation phases (summary)

| Phase | Focus | Apps touched |
|-------|-------|--------------|
| P0 | Entitlement keys on plan + Superadmin matrix UI | Server, Superadmin |
| P1 | `/billing/me` + Admin Plan page + trial banner | Server, Admin |
| P2 | Middleware + nav gates + quota on create | Server, Admin |
| P3 | Trial cron + reminders + Superadmin timeline | Server, Superadmin, Admin |
| P4 | Seat packs + RBAC | Server, Admin |
| P5 | Landing dynamic pricing + payments / add-ons | Landing, Server, Admin |

Details: [05-PHASED-CHECKLIST.md](./05-PHASED-CHECKLIST.md)

---

## 5. File ownership (suggested)

| Concern | Primary paths |
|---------|----------------|
| Plan schema | `server/src/models/SubscriptionPlan.js` |
| Org subscription | `server/src/models/OrganizationSubscription.js` |
| Resolve service | `server/src/services/entitlements.js` *(new)* |
| Middleware | `server/src/middleware/requireEntitlement.js` *(new)* |
| Billing routes | `server/src/routes/billing.js` *(new)* |
| Public plans | `server/src/routes/publicPlans.js` *(new)* |
| Admin provider | `admin/src/context/EntitlementContext.tsx` *(new)* |
| Admin billing UI | `admin/src/components/modules/billing/` *(new)* |
| Landing pricing | `landing/app/components/Pricing.tsx` |
| Superadmin plans UI | `superadmin/src/pages/SubscriptionsPage.tsx` |

---

## 6. Environments

| Env | Landing | Admin | Superadmin | API |
|-----|---------|-------|------------|-----|
| Dev | `:3001` | `:3000` | `:3100` | `:5000` |
| Prod | kabpro.pro | admin.kabpro.pro | superadmin.kabpro.pro | api.kabpro.pro |

Public plan endpoint must be CORS-open for Landing origin (or same-site via nginx proxy). Prefer **public read-only** routes without auth cookies.

---

## 7. Definition of done (whole system)

- [ ] Superadmin can toggle `departments.monthly_billing` on a plan  
- [ ] Admin nav hides Departments billing when feature false  
- [ ] `POST` create vehicle returns `QUOTA_VEHICLES` when over limit  
- [ ] Landing Pricing section renders API plans for selected country  
- [ ] Inquiry with interested plan creates Superadmin lead  
- [ ] Trial expiry cron flips status; Admin shows upgrade wall  

---

*Next: [01-SERVER-IMPLEMENTATION.md](./01-SERVER-IMPLEMENTATION.md)*

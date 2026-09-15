# KABPRO Subscription Data Model

**Audience:** Engineering  
**Status:** Catalog + assignment implemented · Entitlement enforcement planned  

---

## 1. Goals

1. Single catalog of sellable plans with **country pricing**  
2. Per-organization subscription with **trial lifecycle**  
3. Separate **marketing benefits** from **machine entitlements**  
4. Enforce access in **Admin UI + API** (future phases)  
5. Support seat types, add-ons, and per-org overrides without forking catalog rows  

---

## 2. Implemented models

### 2.1 `SubscriptionPlan`

**File:** `server/src/models/SubscriptionPlan.js`  
**Rule:** one row per `(code, country)`

| Field | Type | Notes |
|-------|------|-------|
| name | String | Display name |
| code | String | Uppercase, indexed |
| category | Enum | Free, Starter, Professional, Growth, Enterprise, Custom |
| description | String | Short summary |
| benefits | [{ title, detail }] | Marketing bullets |
| features | [String] | **Legacy** — currently synced from benefit titles (not entitlement keys yet) |
| country | String | ISO 3166-1 alpha-2 |
| countryName | String | Display |
| currency | String | INR, AED, USD, … |
| priceMonthly | Number | |
| priceYearly | Number | |
| pricingLabel | String | e.g. Free, Custom |
| trialDays | Number | Default 14 |
| limits.vehicles | Number | Soft quota (not enforced yet) |
| limits.drivers | Number | Soft quota |
| limits.users | Number | Soft quota (seats) |
| featured | Boolean | |
| isActive | Boolean | |
| sortOrder | Number | |

**Indexes:** unique `{ code, country }`; `{ country, category, sortOrder }`

### 2.2 `OrganizationSubscription`

**File:** `server/src/models/OrganizationSubscription.js`

| Field | Type | Notes |
|-------|------|-------|
| organization | ObjectId → Organization | |
| plan | ObjectId → SubscriptionPlan | |
| status | Enum | Trial, Active, PastDue, Cancelled, Expired |
| billingCycle | Enum | Monthly, Yearly, Custom |
| trialStartsAt / trialEndsAt | Date | |
| startsAt / endsAt | Date | |
| notes | String | |
| assignedBy | ObjectId → User | Superadmin actor |

**Missing today (planned):** payment IDs, invoices, entitlement snapshot, seat quantities purchased, add-on refs.

### 2.3 Supporting platform models

| Model | Purpose |
|-------|---------|
| Organization | Platform customer |
| Project | Linked project / agency context |
| PlatformLead | Sales pipeline |
| PlatformEvent | Audit / funnel trail |

### 2.4 Legacy note
`Project.plan` free-text enum (`Trial` / `Starter` / …) is **not** the source of truth. Prefer `OrganizationSubscription`.

---

## 3. Planned model extensions (P0+)

### 3.1 Entitlement feature entries on plan

Replace legacy string `features` with structured keys (keep benefits separate):

```js
entitlements: [{
  key: String,          // e.g. 'departments.monthly_billing'
  enabled: Boolean,
  value: mongoose.Schema.Types.Mixed  // optional number/enum
}]
```

### 3.2 Seat packs

```js
seatTypes: [{
  role: { type: String, enum: ['admin', 'manager', 'operator', 'viewer'] },
  included: Number,
  priceExtra: Number   // per extra seat / month in plan currency
}]
```

### 3.3 Trial subset (optional)

```js
trialEntitlements: [String]  // if empty → same as paid entitlements
```

### 3.4 Org entitlement override (new collection)

```js
OrgEntitlementOverride {
  organization: ObjectId,
  enable: [String],      // force-on keys
  disable: [String],     // force-off keys
  limits: { ... },       // override caps
  notes: String,
  updatedBy: ObjectId
}
```

### 3.5 Add-ons (new collections)

```js
PlanAddOn {
  code, name, description,
  country, currency,
  priceMonthly, priceYearly,
  entitlements: [...],
  quotaDeltas: { users, vehicles, ... }
}

OrgAddOn {
  organization, addOn, quantity,
  status, startsAt, endsAt
}
```

### 3.6 Entitlement snapshot on subscription

When assigning / converting, copy resolved entitlements onto the subscription document so catalog edits do not silently change live customers until renewal (policy choice — document and stick to it).

---

## 4. Entitlement resolution algorithm

```
function resolveEntitlements(org):
  sub = active OrganizationSubscription for org
  if !sub or sub.status in [Cancelled]: return readOnlyMinimal
  if sub.status == Expired: return readOnlyMinimal

  base = plan.entitlements (+ trialEntitlements if Trial)
  add  = union OrgAddOn entitlements
  over = OrgEntitlementOverride

  features = (base ∪ add ∪ over.enable) − over.disable
  limits   = merge(plan.limits, add.quotaDeltas, over.limits)

  return { features, limits, sub, plan, benefits: plan.benefits }
```

**Expired / no sub:** allow login + billing page + read-only existing data; block creates.

---

## 5. API design

### 5.1 Superadmin (existing + extend)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/superadmin/plans` | Filter country, category, active |
| POST | `/api/superadmin/plans` | Upsert (body.id for update) |
| PUT | `/api/superadmin/plans/:id` | Update |
| DELETE | `/api/superadmin/plans/:id` | Block if active/trial subs |
| POST | `/api/superadmin/plans/seed-defaults` | IN/AE/US templates |
| GET | `/api/superadmin/subscriptions` | List |
| POST | `/api/superadmin/subscriptions` | Assign (+ startTrial) |
| PATCH | `/api/superadmin/subscriptions/:id` | Status / notes |

**Extend upsert body** to accept `entitlements[]`, `seatTypes[]`, `trialEntitlements[]`.

### 5.2 Fleet Admin (new)

| Method | Path | Notes |
|--------|------|-------|
| GET | `/api/billing/me` | Resolved plan, benefits, features map, limits, usage, trialEndsAt |
| GET | `/api/billing/catalog` | Optional public/active plans for upgrade UI (country from org) |
| POST | `/api/billing/upgrade-request` | Creates lead / notifies Superadmin |

### 5.3 Middleware (new)

```js
requireEntitlement('departments.monthly_billing')
requireQuota('vehicles')  // before Vehicle.create
```

Return `403` with machine code:

```json
{
  "success": false,
  "error": "Plan limit reached",
  "code": "QUOTA_VEHICLES",
  "limit": 25,
  "usage": 25,
  "upgradeRequired": true
}
```

---

## 6. Admin client contract

`GET /api/billing/me` response shape (target):

```json
{
  "success": true,
  "subscription": {
    "status": "Trial",
    "billingCycle": "Monthly",
    "trialEndsAt": "2026-09-30T00:00:00.000Z",
    "daysLeft": 14
  },
  "plan": {
    "name": "Starter",
    "code": "STARTER",
    "country": "IN",
    "currency": "INR",
    "priceMonthly": 2999,
    "benefits": [{ "title": "...", "detail": "..." }]
  },
  "features": {
    "module.dashboard": true,
    "departments.monthly_billing": false,
    "drivers.payroll": false
  },
  "limits": { "vehicles": 25, "drivers": 50, "users": 5 },
  "usage": { "vehicles": 12, "drivers": 20, "users": 3 }
}
```

Admin wraps app in `EntitlementProvider`:
- `can('departments.monthly_billing')`
- Hide/disable sidebar items
- Show upgrade CTA on locked routes
- Trial banner when `status === 'Trial'`

---

## 7. Trial automation (P3)

| Job | Action |
|-----|--------|
| Daily cron | Find Trial with `trialEndsAt < now` → set Expired; emit event; notify |
| Reminder job | D-7 / D-3 / D-1 → in-app notification to primary admin |
| Grace (optional) | PastDue for N days after failed renewal before Cancelled |

---

## 8. Seed defaults (current)

Markets: **IN** (INR), **AE** (AED), **US** (USD)  
Templates: Starter, Professional, Growth, Enterprise with sample monthly/yearly prices and benefit bullets.

Command path: Superadmin UI **Seed markets** → `POST /plans/seed-defaults`.

After P0, seed should also write **entitlement keys** per tier (see matrix in **02**).

---

## 9. Migration notes

1. Existing plans keep working; add `entitlements` with defaults derived from category  
2. Keep writing legacy `features` string array from benefit titles until Admin no longer needs it for display  
3. Backfill `OrganizationSubscription` for orgs missing a row (onboard already creates Trial)  
4. Do not delete `Project.plan` until UI references are removed  

---

## 10. Testing checklist

- [ ] Create plan IN + US same code, different prices  
- [ ] Duplicate (code, country) returns 409  
- [ ] Delete blocked while Trial/Active/PastDue exists  
- [ ] Assign trial sets `trialEndsAt = now + trialDays`  
- [ ] `GET /billing/me` returns features + usage  
- [ ] Locked module returns 403 with `upgradeRequired`  
- [ ] Over-quota vehicle create returns `QUOTA_VEHICLES`  
- [ ] Cron expires trial and Admin shows wall  
- [ ] Org override enables a single Professional feature on Starter  

---

## 11. Related documents

- **01-ADMIN-FEATURES** — module → entitlement keys  
- **02-PLAN-ENTITLEMENTS-BLUEPRINT** — commercial matrix & roadmap  
- **03-SUPERADMIN-PLATFORM** — operator workflows  

---

*End of Subscription Data Model*

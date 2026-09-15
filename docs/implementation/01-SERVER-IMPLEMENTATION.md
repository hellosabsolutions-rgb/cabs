# 01 — Server implementation

How the **API** becomes the source of truth for plans, trials, and entitlements.

**Base:** `server/`  
**Related specs:** `docs/02-PLAN-ENTITLEMENTS-BLUEPRINT.md`, `docs/04-SUBSCRIPTION-DATA-MODEL.md`

---

## 1. Current state

| Piece | Status |
|-------|--------|
| `SubscriptionPlan` (country pricing, benefits, soft limits) | Done |
| `OrganizationSubscription` (Trial/Active/…) | Done |
| Superadmin plan CRUD + assign | Done |
| Structured `entitlements[{key,enabled,value}]` | **Todo** |
| `resolveEntitlements(orgId)` service | **Todo** |
| `GET /api/billing/me` | **Todo** |
| `GET /api/public/plans` | **Todo** |
| `requireEntitlement` / `requireQuota` middleware | **Todo** |
| Trial expiry cron | **Todo** |

---

## 2. Schema changes (P0)

### 2.1 Extend `SubscriptionPlan`

Keep `benefits` for marketing. Add machine entitlements:

```js
entitlements: [{
  key: { type: String, required: true, trim: true }, // 'bookings.crud'
  enabled: { type: Boolean, default: true },
  value: { type: mongoose.Schema.Types.Mixed, default: null }
}],

seatTypes: [{
  role: { type: String, enum: ['admin', 'manager', 'operator', 'viewer'] },
  included: { type: Number, default: 0 },
  priceExtra: { type: Number, default: 0 }
}],

trialEntitlements: [{ type: String }], // empty = same as paid
```

**Migration:** For existing plans, seed `entitlements` from category defaults (Starter / Professional / … matrix in blueprint). Keep writing legacy `features: string[]` from benefit titles until Landing no longer needs it.

### 2.2 Optional new collections (P4–P5)

- `OrgEntitlementOverride` — per-org enable/disable/limit overrides  
- `PlanAddOn` / `OrgAddOn` — modular extras  

Ship P0–P2 without these if needed; leave hooks in the resolve service.

---

## 3. Entitlement catalog constant

Create `server/src/constants/entitlementKeys.js` listing every key from `docs/01-ADMIN-FEATURES.md` §9.

Use it to:
- Validate Superadmin upsert payloads  
- Seed default matrices by category  
- Document API 403 codes  

---

## 4. Resolve service

**New file:** `server/src/services/entitlements.js`

```js
export async function resolveEntitlements(organizationId) {
  // 1. Load latest OrgSubscription (populate plan)
  // 2. If missing / Cancelled → readOnlyMinimal
  // 3. If Expired → readOnlyMinimal (+ allow billing page)
  // 4. Base = plan.entitlements (or trialEntitlements if Trial)
  // 5. Merge add-ons + overrides (when exist)
  // 6. Compute usage (count vehicles/drivers/users for org agencies)
  // 7. Return { subscription, plan, features, limits, usage, benefits }
}

export function hasFeature(resolved, key) {
  return resolved.features?.[key] === true;
}

export function checkQuota(resolved, resource) {
  // resource: 'vehicles' | 'drivers' | 'users' | ...
  // return { ok, limit, usage, code }
}
```

### Usage counting

Resolve org → primary agency / all agencies linked via `organizationId` (or user agencies). Count:

| Resource | Count source |
|----------|--------------|
| vehicles | Vehicle docs for agency(ies) |
| drivers | Driver docs |
| users | Users with membership on those agencies |
| agencies | Agency count for org |

---

## 5. HTTP APIs

### 5.1 Authenticated billing (Admin)

**Route file:** `server/src/routes/billing.js`  
**Mount:** `app.use('/api/billing', protect, billingRoutes)`

| Method | Path | Behavior |
|--------|------|----------|
| GET | `/me` | `resolveEntitlements` for caller’s org |
| POST | `/upgrade-request` | Create `PlatformLead` or notify Superadmin |

**Org resolution for fleet user:**  
`user → agencies → organizationId` (add `organizationId` on Agency if missing; or map via Project). Document the chosen link and stick to it.

### 5.2 Public catalog (Landing)

**Route file:** `server/src/routes/publicPlans.js`  
**Mount:** `app.use('/api/public', publicPlansRoutes)` — **no auth**

| Method | Path | Behavior |
|--------|------|----------|
| GET | `/plans?country=IN` | Active plans for country, sorted; strip internal fields |
| GET | `/plans/featured?country=IN` | Optional featured-only |

Response shape (example):

```json
{
  "success": true,
  "country": "IN",
  "currency": "INR",
  "plans": [
    {
      "code": "PROFESSIONAL",
      "name": "Professional",
      "description": "...",
      "priceMonthly": 2999,
      "priceYearly": 29990,
      "pricingLabel": "",
      "trialDays": 14,
      "featured": true,
      "benefits": [{ "title": "...", "detail": "" }],
      "limits": { "vehicles": 100, "drivers": 200, "users": 15 }
    }
  ]
}
```

Rate-limit this route.

### 5.3 Extend Superadmin upsert

In `buildPlanPayload` (`platformOpsController.js`):
- Accept `entitlements`, `seatTypes`, `trialEntitlements`  
- Validate keys against `entitlementKeys`  
- Do **not** overwrite entitlements from benefit titles  

Update `seedDefaultPlans` to write full entitlement matrices per tier.

---

## 6. Middleware (P2)

**Files:**
- `server/src/middleware/requireEntitlement.js`
- `server/src/middleware/requireQuota.js`

```js
// requireEntitlement('departments.monthly_billing')
export const requireEntitlement = (key) => asyncHandler(async (req, res, next) => {
  const resolved = await resolveEntitlements(req.organizationId);
  if (!hasFeature(resolved, key)) {
    return res.status(403).json({
      success: false,
      error: 'Your plan does not include this feature.',
      code: 'FEATURE_LOCKED',
      feature: key,
      upgradeRequired: true
    });
  }
  req.entitlements = resolved;
  next();
});
```

```js
// requireQuota('vehicles') before create handlers
export const requireQuota = (resource) => asyncHandler(async (req, res, next) => {
  const resolved = req.entitlements || await resolveEntitlements(req.organizationId);
  const q = checkQuota(resolved, resource);
  if (!q.ok) {
    return res.status(403).json({
      success: false,
      error: `Plan limit reached for ${resource}.`,
      code: `QUOTA_${resource.toUpperCase()}`,
      limit: q.limit,
      usage: q.usage,
      upgradeRequired: true
    });
  }
  next();
});
```

### Where to attach (priority)

| Route area | Feature key | Quota |
|------------|-------------|-------|
| Vehicles create | `vehicles.crud` | `vehicles` |
| Drivers create | `drivers.crud` | `drivers` |
| User invite | — | `users` |
| Department contracts / bills | `departments.*` | — |
| Bookings create | `bookings.crud` | `bookings` (monthly, later) |
| Payroll | `drivers.payroll` | — |
| Multi agency create | `agency.create` | `agencies` |

Attach gradually: start with vehicles + drivers + department billing.

---

## 7. Trial lifecycle (P3)

**File:** `server/src/jobs/subscriptionLifecycle.js`

| Job | Schedule | Action |
|-----|----------|--------|
| Expire trials | Daily | `status: Trial` and `trialEndsAt < now` → `Expired` + platform event |
| Reminders | Daily | D-7 / D-3 / D-1 → create Notification for primary admin |

Wire from `server.js` with `node-cron` or a simple `setInterval` if cron not present.

On onboard (`superadminController`), keep auto-Trial; ensure `trialEndsAt` uses plan `trialDays`.

---

## 8. Caching

- Cache `resolveEntitlements` in-memory / Redis for 30–60s per org  
- Invalidate on Superadmin assign / plan update / override change  
- Landing public plans: cache 5 minutes per country  

---

## 9. Test plan (server)

1. Seed plans with entitlements for IN  
2. Assign Trial STARTER to org  
3. `GET /api/billing/me` as fleet admin → features + daysLeft  
4. Toggle off `bookings.crud` → booking create 403 `FEATURE_LOCKED`  
5. Set `limits.vehicles = 1`, create second vehicle → `QUOTA_VEHICLES`  
6. `GET /api/public/plans?country=IN` → no auth, active only  
7. Expire trial manually → resolve returns read-only  

---

## 10. Rollout safety

- Default: if plan has **empty** entitlements array, treat as **full access** (legacy orgs) until seed runs  
- After seed: enforce  
- Feature flag env: `ENTITLEMENTS_ENFORCE=true` to flip hard enforcement in production  

---

*Next: [02-ADMIN-DASHBOARD-CONSUMPTION.md](./02-ADMIN-DASHBOARD-CONSUMPTION.md)*

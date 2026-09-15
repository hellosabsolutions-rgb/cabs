# 05 — Phased implementation checklist

Track shipping order across **Server**, **Admin**, **Landing**, **Superadmin**.

Legend: `[ ]` todo · `[x]` done · `[-]` deferred

---

## P0 — Catalog truth

**Outcome:** Plans store real entitlement keys; Superadmin can edit them.

### Server
- [ ] Add `entitlements`, `seatTypes`, `trialEntitlements` to `SubscriptionPlan`
- [ ] Add `server/src/constants/entitlementKeys.js`
- [ ] Extend `buildPlanPayload` / upsert validation
- [ ] Update `seedDefaultPlans` matrices
- [ ] Migration / backfill script for existing plans

### Superadmin
- [ ] Features matrix UI on plan create/edit
- [ ] Seat packs fields
- [ ] Re-seed markets and verify IN/AE/US

### Admin / Landing
- [-] No consumer changes required yet

**Exit criteria:** Plan JSON in Mongo shows entitlement keys; seed idempotent.

---

## P1 — Resolve + show (Admin)

**Outcome:** Fleet users see their plan, benefits, trial, usage.

### Server
- [ ] `services/entitlements.js` → `resolveEntitlements`
- [ ] Link Agency/User → Organization
- [ ] `GET /api/billing/me`
- [ ] `POST /api/billing/upgrade-request` → PlatformLead

### Admin
- [ ] `EntitlementProvider`
- [ ] Plan status banner
- [ ] `/billing` page (plan, benefits, usage bars)
- [ ] Soft-fail if API old

### Superadmin
- [ ] Confirm assign trial visible in Admin within seconds

### Landing
- [-] Still hardcoded OK

**Exit criteria:** Test org Admin shows correct plan name + daysLeft.

---

## P2 — Enforce

**Outcome:** Locked features cannot be used via API or UI.

### Server
- [ ] `requireEntitlement` middleware
- [ ] `requireQuota` middleware
- [ ] Attach to vehicles, drivers, department billing first
- [ ] Env `ENTITLEMENTS_ENFORCE=true`
- [ ] Legacy empty entitlements = allow (until seeded)

### Admin
- [ ] Sidebar featureKey gating
- [ ] `RequireFeature` route wrapper
- [ ] Quota gate on Add Vehicle / Add Driver
- [ ] Handle `FEATURE_LOCKED` / `QUOTA_*` without logout

### Superadmin
- [ ] Toggle a key → Admin updates after refresh

### Landing
- [-] N/A

**Exit criteria:** Starter org cannot open monthly department billing; over-quota create returns 403.

---

## P3 — Trial lifecycle

**Outcome:** Trials expire automatically; reminders fire.

### Server
- [ ] Daily expire job
- [ ] D-7 / D-3 / D-1 notifications
- [ ] Platform events on expire / extend

### Superadmin
- [ ] Org timeline UI
- [ ] Extend trial (+7 / +14) action

### Admin
- [ ] Expired wall / read-only messaging
- [ ] Banner urgency for D-3 / D-1

### Landing
- [-] N/A

**Exit criteria:** Past `trialEndsAt` → status Expired without manual patch.

---

## P4 — Seats & RBAC

**Outcome:** Seat counts + role permissions inside unlocked modules.

### Server
- [ ] Enforce `limits.users` on invite
- [ ] Role permission matrix middleware (optional separate from entitlements)
- [ ] `OrgEntitlementOverride` collection + Superadmin UI

### Admin
- [ ] Invite UI shows seats used / remaining
- [ ] Hide actions by role (operator vs admin)

### Superadmin
- [ ] Seat packs on plan editor
- [ ] Per-org override editor

### Landing
- [-] Optional: show “X users included” from limits

**Exit criteria:** Cannot invite beyond seat cap; operator cannot access payroll settle.

---

## P5 — Landing + commerce

**Outcome:** Public pricing is live; path to pay / contact is clear.

### Server
- [ ] `GET /api/public/plans?country=`
- [ ] `POST /api/public/leads` (rate-limited)
- [ ] (Later) Razorpay/Stripe checkout session
- [ ] Add-ons models (optional)

### Landing
- [ ] `NEXT_PUBLIC_API_URL`
- [ ] Dynamic `Pricing.tsx` + country switcher
- [ ] CTA → inquiry with `interestedPlan`
- [ ] Fallback if API down

### Admin
- [ ] Upgrade CTA deep-links / post-payment refresh entitlements

### Superadmin
- [ ] Lead appears from Landing inquiry
- [ ] Price edit reflects on Landing after cache TTL

**Exit criteria:** Change Professional IN price in Superadmin → Landing shows new price; inquiry creates lead with plan code.

---

## Cross-cutting always

- [ ] Docs updated when keys added (`docs/01` + entitlementKeys)
- [ ] No secrets in client bundles
- [ ] Enforce on server; UI is convenience only
- [ ] Auto-logout only on 401 auth failure — not on feature 403

---

## Suggested first sprint (2 weeks)

1. P0 schema + seed + Superadmin matrix  
2. P1 `/billing/me` + Admin banner/page  
3. Start P2 on vehicles quota + one department feature  

Landing dynamic pricing can wait until catalog is stable (end of P0/P1).

---

*Back to [implementation README](./README.md)*

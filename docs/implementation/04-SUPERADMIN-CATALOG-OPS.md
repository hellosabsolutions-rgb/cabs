# 04 — Superadmin catalog ops (implementation)

How **Superadmin** (`superadmin/`) finishes the catalog so Landing + Admin can consume it.

**App:** https://superadmin.kabpro.pro · local `:3100`  
**Existing:** Plans CRUD, country filters, benefits, prices, assign trial — see `docs/03-SUPERADMIN-PLATFORM.md`

---

## 1. Gaps to close

| Need | UI change |
|------|-----------|
| Machine entitlements | Feature matrix toggles on plan form |
| Seat packs | Seat type rows (role + included + extra price) |
| Trial subset | Optional “trial features differ from paid” |
| Seed with entitlements | Update Seed markets to write keys |
| Org timeline | Org detail: onboard → trial → events → usage |
| Landing sync | After save, public catalog updates (cache TTL) |

---

## 2. Plan form extensions

Extend `SubscriptionsPage` (or split `PlanEditorModal`):

### Tabs / sections
1. **Basics** — name, code, category, description, country, currency  
2. **Pricing** — monthly, yearly, pricingLabel, trialDays, featured, active  
3. **Benefits** — title/detail list (Landing + Admin billing)  
4. **Features** — searchable checklist of entitlement keys grouped by module  
5. **Limits & seats** — vehicles/drivers/users + seatTypes table  

### Features UI pattern
- Group by module (Vehicles, Drivers, Departments, …)  
- Toggle enabled  
- Optional value input for numeric keys (if any)  
- “Apply Professional defaults” button (loads matrix template)  

Persist via existing `POST /api/superadmin/plans` with new fields.

---

## 3. Seed defaults

Update `seedDefaultPlans` in `platformOpsController.js` to include `entitlements` per template using the blueprint matrix:

| Code | Includes (examples) |
|------|---------------------|
| STARTER | dashboard, vehicles, drivers.crud, bookings, expenses, compliance, maintenance |
| PROFESSIONAL | + departments.*, profitability.*, revenue.*, drivers.payroll |
| GROWTH | + agency.multi, activity.export, higher limits |
| ENTERPRISE | all keys true, custom limits |

After seed, Landing and Admin both see consistent packaging.

---

## 4. Org subscription timeline (P3 UI)

On organization detail (or subscriptions table expand):

- Status pill + trialEndsAt countdown  
- Plan code / country / price snapshot  
- Recent `PlatformEvent` rows for that org  
- Buttons: Extend trial (+7d), Activate, Expire, Change plan  
- Usage snapshot (call internal resolve or counts endpoint)

---

## 5. Ops playbook

### Launch a new market (e.g. SG)
1. Seed or duplicate plans with `country=SG`, `currency=SGD`  
2. Set prices + benefits in local language if needed  
3. Confirm `GET /api/public/plans?country=SG`  
4. Landing country chip includes SG  

### Give a customer custom features
1. Prefer assign higher plan, or  
2. (P4+) OrgEntitlementOverride enable keys without changing catalog  

### Stop a churned org
1. Patch subscription → Expired / Cancelled  
2. Admin resolve → read-only / upgrade wall  

---

## 6. Implementation checklist (Superadmin)

- [ ] API accepts entitlements / seatTypes on upsert  
- [ ] Plan editor Features tab  
- [ ] Seed writes entitlements  
- [ ] Org timeline panel  
- [ ] Manual “Extend trial” action  
- [ ] Confirm Export still works for plans/subscriptions  

---

*Next: [05-PHASED-CHECKLIST.md](./05-PHASED-CHECKLIST.md)*

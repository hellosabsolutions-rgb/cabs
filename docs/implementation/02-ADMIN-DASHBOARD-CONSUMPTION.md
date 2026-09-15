# 02 — Admin dashboard consumption

How the **fleet Admin** (`admin/`) reads entitlements and gates the product UI.

**App:** https://admin.kabpro.pro · local `:3000`  
**Depends on:** Server `GET /api/billing/me` (see `01-SERVER-IMPLEMENTATION.md`)

---

## 1. Current state

- All sidebar modules visible to every logged-in agency user  
- Roles `admin` / `manager` / `operator` are display-only  
- No plan / trial / usage UI  
- Unauthorized API → session clear (`fleetos:unauthorized`) already works  

---

## 2. Target UX

1. After login, load entitlements once  
2. Sidebar / routes respect `can('feature.key')`  
3. Locked module → upgrade page (not blank 404)  
4. Trial banner: “X days left on Professional trial”  
5. Profile / Billing shows plan, benefits, usage bars  
6. Create vehicle when over quota → toast from API error `QUOTA_*`

---

## 3. EntitlementProvider

**New:** `admin/src/context/EntitlementContext.tsx`

```tsx
type EntitlementsState = {
  loading: boolean;
  status: 'Trial' | 'Active' | 'PastDue' | 'Expired' | 'Cancelled' | null;
  daysLeft: number | null;
  plan: { name: string; code: string; country: string; currency: string } | null;
  benefits: { title: string; detail?: string }[];
  features: Record<string, boolean | number>;
  limits: Record<string, number>;
  usage: Record<string, number>;
  can: (key: string) => boolean;
  refresh: () => Promise<void>;
};
```

### Bootstrap

Wrap inside existing providers (after `AuthProvider`):

```tsx
<AuthProvider>
  <EntitlementProvider>
    <AgencyProvider>
      ...
```

- Fetch `GET ${API_URL}/billing/me` when `token` present  
- On 401 → existing unauthorized path  
- Soft-fail: if endpoint missing (older API), `can()` returns `true` (dev safety) until enforce flag  

### Helpers

```tsx
can('departments.monthly_billing')
usagePct('vehicles') // usage/limits
isTrialing
isExpired
```

---

## 4. Map modules → feature keys

Use keys from `docs/01-ADMIN-FEATURES.md`.

| Sidebar / route | Required feature (example) |
|-----------------|----------------------------|
| Dashboard | `module.dashboard` |
| Vehicles | `vehicles.crud` |
| Drivers list | `drivers.crud` |
| Attendance | `drivers.attendance` |
| Driver expenses | `drivers.expenses` |
| Payroll | `drivers.payroll` |
| Dept contracts | `departments.contracts` |
| Duty logs | `departments.duty_logs` |
| Monthly billing | `departments.monthly_billing` |
| Weekend billing | `departments.weekend_billing` |
| Dept payments | `departments.payments` |
| Booking | `bookings.crud` |
| FASTag / Fuel / All expenses | `expenses.*` |
| Profitability | `profitability.overview` |
| Revenue | `revenue.overview` |
| Compliance | `compliance.vehicle` |
| Maintenance | `maintenance.crud` |
| Activity | `activity.feed` |
| Reports (support) | `support.tickets` |
| Notifications | `notifications.in_app` |

**Sidebar:** hide or show lock icon when `!can(key)`.  
**Router:** wrap protected views with `<RequireFeature feature="..." />`.

---

## 5. Components to add

### 5.1 Trial / plan banner
`admin/src/components/billing/PlanStatusBanner.tsx`

- Show when `status === 'Trial'` or `PastDue` or `Expired`  
- CTA: “View plan” → `/billing` or `/profile?tab=plan`

### 5.2 Billing / Plan page
`admin/src/components/modules/billing/BillingView.tsx`  
Route: `/billing` or Profile tab

Show:
- Plan name, country price, billing cycle  
- Benefits list (from API)  
- Feature checklist (human labels for keys)  
- Usage bars: vehicles / drivers / users  
- Button: “Request upgrade” → `POST /api/billing/upgrade-request`

### 5.3 Locked module panel
When user hits locked route:

```
This feature is on Professional and above.
Your plan: Starter · Upgrade to unlock Department billing.
```

### 5.4 Quota-aware create buttons
Before opening Add Vehicle modal, if `usage.vehicles >= limits.vehicles`, open upgrade modal instead of form. Still rely on server for final deny.

---

## 6. API client changes

Use existing `api` / `apiRequest` so 401 refresh still works.

Handle structured errors:

```ts
if (err.code === 'FEATURE_LOCKED' || err.code?.startsWith('QUOTA_')) {
  showUpgradeToast(err);
}
```

Do **not** special-case logout on `403 FEATURE_LOCKED` — that is not session death.

---

## 7. Role × entitlement (P4)

Later:
- Entitlements unlock **modules**  
- Role unlocks **actions inside** modules (e.g. operator cannot settle payroll even if payroll feature on)

Until P4, any seat with a feature can use it fully.

---

## 8. Implementation steps (Admin)

1. Add `EntitlementContext` + wire in `App.tsx`  
2. Add `/billing` route + banner in `MainLayout`  
3. Annotate `Sidebar.tsx` items with `featureKey`  
4. Add `RequireFeature` for high-value routes (departments billing, payroll, profitability)  
5. Map create flows for vehicles/drivers to quota checks  
6. QA with Superadmin flipping keys on a test org’s plan  

---

## 9. Local testing

1. API running with entitlements seeded  
2. Superadmin assigns Trial Professional to test org  
3. Login Admin → banner shows days left; Departments visible  
4. Superadmin removes `departments.monthly_billing` (or assign Starter)  
5. Refresh Admin → billing nav locked; API returns 403  

---

*Next: [03-LANDING-PAGE-CONSUMPTION.md](./03-LANDING-PAGE-CONSUMPTION.md)*

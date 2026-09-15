# KABPRO Plan & Entitlements Blueprint

**Audience:** Product, sales, engineering, leadership  
**Scope:** Whole product (Superadmin catalog + Admin enforcement + future self-serve)  
**Status:** Catalog partial · Enforcement not wired

---

## 1. Executive summary

KABPRO Admin exposes a full fleet operating system (14 modules). Superadmin can already define **country-priced plans**, marketing **benefits**, soft **limits**, and assign **trials** — but Admin **ignores** those plans today.

This blueprint defines how customers **choose and buy** access:

1. **Benefits** — human marketing copy  
2. **Features** — machine entitlement keys that gate modules/APIs  
3. **Quotas** — vehicles, drivers, seats, agencies  
4. **Seat types** — Admin / Manager / Operator (customizable)  
5. **Country pricing** — one plan row per market  
6. **Trials** — fully managed timeline with Admin visibility  

**Do not start with payment gateways.** Ship catalog truth → Admin visibility → API enforcement → trial automation → seats → commerce.

---

## 2. Current gap

| Capability | Today |
|------------|-------|
| Plan catalog (name, country, price, benefits, limits) | Superadmin ✓ |
| Assign Trial / Active / Expired | Superadmin ✓ |
| Feature matrix (boolean/numeric keys) | ✗ (benefits are copy only) |
| Admin “My plan” / trial banner / usage bars | ✗ |
| API middleware requireEntitlement | ✗ |
| Quota checks on create vehicle/driver/user | ✗ |
| Cron expire trials | ✗ |
| Seat packs + RBAC | ✗ |
| Add-ons / org overrides / Stripe-Razorpay | ✗ |

---

## 3. Recommended commercial tiers

One catalog row per `(code × country)`. Prices are illustrative; Superadmin edits live amounts.

| Tier | Who it is for | Core unlock | Soft quotas (example IN) | Trial |
|------|---------------|-------------|--------------------------|-------|
| Free / Trial | Evaluate product | Dashboard + Vehicles + Drivers list + Bookings lite | 5 veh · 10 drivers · 2 users | 14 days |
| Starter | Small taxi / trip fleets | + Fuel/FASTag + Compliance + Maintenance | 25 veh · 50 drivers · 5 users | 14 days |
| Professional | Dept + trip operators | + Full Departments (contracts/billing/GST) + Profitability + Revenue | 100 veh · 200 drivers · 15 users | 14 days |
| Growth | Multi-city / multi-agency | + Multi-agency + Activity export + higher seats | 250 veh · 500 drivers · 40 users | 14 days |
| Enterprise / Custom | Large fleets / tenders | All modules + SLA + custom entitlements + add-ons | Custom / unlimited | 30 days |

### Customer-facing benefits vs machine features

| Type | Purpose | Used for access control? |
|------|---------|--------------------------|
| **Benefits** `{ title, detail }` | Pricing cards, onboard, upgrade screens | No |
| **Features** `{ key, enabled, value? }` | Admin nav + API gates | **Yes** |

Same plan code can share entitlement keys across countries while showing different currency prices and local benefit wording.

---

## 4. Starter feature matrix

| Capability | Free/Trial | Starter | Professional | Growth | Enterprise |
|------------|------------|---------|--------------|--------|------------|
| Dashboard | Yes | Yes | Yes | Yes | Yes |
| Vehicles + Drivers CRUD | Yes | Yes | Yes | Yes | Yes |
| Bookings | Yes | Yes | Yes | Yes | Yes |
| Fuel / FASTag / Maintenance | Limited | Yes | Yes | Yes | Yes |
| Compliance alerts | Yes | Yes | Yes | Yes | Yes |
| Departments + GST billing | — | — | Yes | Yes | Yes |
| Weekend billing | — | — | Yes | Yes | Yes |
| Profitability + Revenue | — | — | Yes | Yes | Yes |
| Driver payroll | — | Add-on | Yes | Yes | Yes |
| Multi-agency | — | — | — | Yes | Yes |
| Activity export | — | — | — | Yes | Yes |
| Push notifications | — | Yes | Yes | Yes | Yes |
| Voice fill | — | Add-on | Yes | Yes | Yes |
| Live GPS tracking | — | — | Add-on | Add-on | Yes |
| Custom entitlements / SLA | — | — | — | — | Yes |

---

## 5. Dynamic pricing model

### 5.1 Country base price
- Unique index on `(code, country)`
- Fields: `priceMonthly`, `priceYearly`, `currency`, `pricingLabel` (Free / Custom), `featured`, `isActive`
- Seed markets today: IN, AE, US (UI also lists GB, SG, AU, CA, SA)

### 5.2 Add-ons (modular extras)
Priced separately or bundled:
- Extra admin seats
- GPS / live tracking pack
- SMS / WhatsApp
- Voice fill
- Multi-agency unlock
- Weekend billing unlock
- Payroll unlock on Starter

### 5.3 Enterprise / custom deals
- Clone a catalog plan → override prices + entitlements + trial days **per organization**
- Overrides never rewrite the global catalog

### 5.4 Superadmin plan editor sections

| Section | Fields | Purpose |
|---------|--------|---------|
| Identity | name, code, category, description, sortOrder, isActive, featured | Catalog listing |
| Market | country, countryName, currency | Local pricing |
| Prices | priceMonthly, priceYearly, pricingLabel, billingCycles[] | Checkout / invoices later |
| Trial | trialDays, trialEntitlements (optional subset) | What trial unlocks vs paid |
| Benefits | benefits[{title, detail, highlight}] | Marketing copy |
| Features matrix | features[{key, enabled, value?}] | Enforcement |
| Quotas | limits.{vehicles, drivers, users, agencies, bookingsPerMonth, storageMb} | Caps + upgrade CTA |
| Seat packs | seatTypes[{role, included, priceExtra}] | Admin / Manager / Operator |
| Add-ons | allowedAddOnIds[] | Which extras attach |

---

## 6. Seat & user-type model

Separate **how many people** (plan seats) from **what each person can do** (role permissions inside unlocked modules).

| Seat type | Default permissions | Plan control |
|-----------|---------------------|--------------|
| Admin | Full unlocked modules; agency settings; invite seats | Counts toward `limits.users`; often 1–3 included |
| Manager | Money + departments + profitability write; no agency delete | Included or add-on seat pack |
| Operator | Bookings, duty logs, attendance, fuel entry | Cheapest seat; dispatch volume |
| Viewer *(future)* | Read-only dashboards / reports | Optional Enterprise add-on |
| Driver app seat *(future)* | Driver mobile login | Maps to `limits.max_drivers` |

**Customization path:** Superadmin (or Enterprise deal) attaches a permission override JSON per org — e.g. unlock `departments.weekend_billing` for a Starter customer, or cap Operator write on payroll.

---

## 7. Trial → paid timeline (fully managed)

| Day / event | System action | Who sees it |
|-------------|---------------|-------------|
| Org onboard | Auto-assign Trial on market STARTER (or chosen plan); set `trialEndsAt` | Superadmin event + Admin banner |
| During trial | Resolve entitlements = trial matrix (equal to paid or subset) | Admin: usage meters + “X days left” |
| D-7 / D-3 / D-1 | Notify primary admin (in-app; email later) | Admin notifications · Superadmin funnel |
| `trialEndsAt` | Cron: Trial → Expired (or PastDue if payment pending) | Admin read-only / upgrade wall |
| Convert | Assign Active + billingCycle; snapshot entitlements | Superadmin assign or future self-serve |
| Renew / fail | Active → PastDue → Cancelled with grace days | Both consoles + audit trail |

### Superadmin must manage
- Plan catalog CRUD + seed markets  
- Feature matrix editor (toggle keys)  
- Benefits editor (marketing)  
- Assign / extend / end trial  
- Org timeline: onboard → trial → paid → churn  
- Usage vs limits snapshot per org  

### Admin must show
- Current plan name + country price  
- Trial countdown / expiry wall  
- Usage bars (vehicles, drivers, seats)  
- Locked module upgrade CTAs  
- Included benefits list  
- Request upgrade / contact sales  

---

## 8. Enforcement architecture

| Layer | Responsibility | Status |
|-------|----------------|--------|
| `SubscriptionPlan` | Catalog: prices, benefits, feature keys, quotas, seat packs | Partial |
| `OrganizationSubscription` | Assignment + trial dates + status + entitlement snapshot | Partial |
| `OrgEntitlementOverride` | Per-org custom unlocks / caps | New |
| `PlanAddOn` + `OrgAddOn` | Extra seats / modules | New |
| Server middleware | `requireEntitlement(key)` on mutating APIs; quota on create | New — critical |
| Admin `EntitlementProvider` | Hide/disable nav from `GET /billing/me` | New — critical |
| Cron / jobs | Expire trials, PastDue dunning, usage snapshots | New |

### Resolution order
1. Base plan features  
2. Add-ons  
3. Org overrides  
4. Trial subset (if status = Trial)  
5. Expired = read-only / block create  

**Always enforce on API, never UI-only.**

---

## 9. Admin modules → suggested tier (packaging view)

| Module | Entitlement keys | Suggested tier |
|--------|------------------|----------------|
| Dashboard | `module.dashboard` | All plans |
| Vehicles | `vehicles.*` · `limits.max_vehicles` | Starter+ |
| Drivers | `drivers.*` · `limits.max_drivers` | Starter+ / Pro payroll |
| Departments | `departments.*` | Professional+ |
| Bookings | `bookings.*` | Starter+ |
| Expenses | `expenses.*` | Starter+ |
| Profitability | `profitability.*` | Professional+ |
| Revenue | `revenue.*` | Professional+ |
| Compliance | `compliance.*` | Starter+ |
| Maintenance | `maintenance.*` | Starter+ |
| Activity | `activity.*` | Growth+ |
| Notifications | `notifications.*` | Starter+ / Pro push |
| Support reports | `support.tickets` | All plans |
| Multi-agency | `agency.multi` · `agency.create` | Growth+ |

Full module inventory: see **01-ADMIN-FEATURES**.

---

## 10. Implementation roadmap

| Phase | Scope | Outcome |
|-------|-------|---------|
| **P0 — Catalog truth** | Extend `SubscriptionPlan` with `features[]` keys + `seatTypes`; keep benefits separate; Superadmin matrix UI | Plans describe real product access |
| **P1 — Resolve + show** | `GET /api/billing/me`; Admin Plan/Billing page + trial banner + usage bars | Customers see what they have |
| **P2 — Enforce** | Server entitlement middleware + create quotas; hide locked nav | Plans actually mean something |
| **P3 — Trial lifecycle** | Cron expire; D-7/3/1 notifies; Superadmin org timeline | Trials fully managed |
| **P4 — Seats & RBAC** | Invite against seat packs; gate actions by role × entitlement | User-type customisation |
| **P5 — Commerce** | Add-ons, org overrides, Razorpay/Stripe (country), invoices | Self-serve + Enterprise deals |

---

## 11. Success criteria

- Sales can describe **5 clear tiers** with a feature matrix PDF  
- Superadmin can flip a feature key and Admin loses/gains a module without a deploy of hard-coded flags  
- Trial orgs see countdown and cannot silently keep Pro features after expiry  
- Create vehicle/driver/user fails with a clear upgrade error when over quota  
- Enterprise deals use overrides, not fork of catalog code  

---

*End of Plan & Entitlements Blueprint*

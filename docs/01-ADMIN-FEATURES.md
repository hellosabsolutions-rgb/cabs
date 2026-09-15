# KABPRO Admin — Features Catalog

**Audience:** Product, sales, engineering  
**App:** Fleet Admin (`admin/`)  
**Status:** All modules unrestricted today (no plan / entitlement gates)

---

## 1. Access & shell

### Authentication
- Email / password login and register
- Google OAuth (when `VITE_GOOGLE_CLIENT_ID` is set)
- JWT access token + refresh token rotation
- Remember-me / device sessions (list, revoke one, revoke all others)
- Auto logout on unauthorized / failed refresh (`fleetos:unauthorized`)

### Agency gate
- Authenticated users with **zero agencies** must complete **Agency Onboarding** (company profile → contact/base → GSTIN/PAN) before the main shell
- Multi-agency switcher: switch agency, create agency, view/edit agency profile

### Shell chrome (always available)
- Global search
- Soft refresh / sync
- Language selector (22+ Indian languages)
- Theme (dark / light)
- Notification bell
- User menu + role badge display

### Suggested entitlement keys
`auth.google` · `agency.multi` · `agency.create`

---

## 2. Navigation map

| Group | Menu item | Route(s) |
|-------|-----------|----------|
| Dashboard | Dashboard | `/`, `/dashboard` |
| Vehicles | Vehicles | `/vehicles`, `/vehicles/:id` |
| Drivers | Driver list | `/drivers`, `/drivers/list` |
| Drivers | Attendance | `/drivers/attendance` |
| Drivers | Driver expenses | `/drivers/expenses` |
| Drivers | Driver payroll | `/drivers/payroll` |
| Departments | Contracts | `/departments`, `/departments/contracts` |
| Departments | Daily duty logs | `/departments/duty-logs` |
| Departments | Monthly billing | `/departments/billing` |
| Departments | Payments | `/departments/payments` |
| Departments | Sat–Sun Off Duty Billing | `/departments/weekend-billing` *(subtab; not in sidebar)* |
| Booking | Booking | `/booking`, `/bookings` (`/trips` redirects here) |
| Money | FASTag per vehicle | `/expenses`, `/expenses/fastag` |
| Money | Fuel tracking & logs | `/expenses/fuel` |
| Money | All expenses | `/expenses/all` |
| Money | Profitability | `/profitability` (+ `?ledger=`) |
| Money | Revenue | `/revenue` |
| Compliance | Documents | `/compliance` |
| Compliance | Maintenance | `/maintenance` |
| System | Activity | `/activity` |
| System | Report (support tickets) | `/report`, `/reports` |
| System | Notifications | `/notifications` |
| System | Profile & Settings | `/profile` |

---

## 3. Module detail

### 3.1 Dashboard
**Route:** `/dashboard`  
**Entitlement:** `module.dashboard` (all plans)

- Live KPI cards: total revenue (dept vs trip), expenses (fuel/toll/driver), net profit/margin, fleet counts
- Monthly revenue vs expense bars
- Expense mix breakdown
- Operations snapshot (dept cabs, trip cabs, fuel fills, live trips, drivers)
- Compliance summary (expiring / expired)
- Per-vehicle live table + profitability ranking

---

### 3.2 Vehicles
**Routes:** `/vehicles`, `/vehicles/:id`  
**Entitlements:** `vehicles.crud` · `vehicles.bulk_import` · `vehicles.mode_switch` · `vehicles.detail` · `vehicles.live_tracking` *(future)* · `limits.max_vehicles`

#### Fleet roster
- Create / edit / delete vehicles
- Status cycle: Running/Active → Idle → Maintenance → Running
- Mode switch: **Department** ↔ **Trip-based** (weekend-trip flag on dept vehicles)
- Filters: type, search; stats (running/idle/maintenance/dept/trip)
- Bulk import Excel + template download
- Docs at create: RC, Insurance, PUC, Permit, Auth (+ fitness fields)
- FASTag id/bank/balance, GPS IMEI, photo, odometer, fuel type, seating

#### Vehicle detail
- Tabs: overview · compliance · trips/bookings · expenses
- Linked duty logs, fuel, FASTag, maintenance, P&L
- Availability check modal (shared with bookings)

#### Not production-ready
- `LiveTrackingView` — mock telemetry (socket `/tracking` prepared, not auto-connected)
- Legacy dept/trip-only list views exist as files but are not on the current route UI

---

### 3.3 Drivers
**Entitlements:** `drivers.crud` · `drivers.bulk_import_export` · `drivers.assignment` · `drivers.attendance` · `drivers.attendance.bulk` · `drivers.expenses` · `drivers.payroll` · `drivers.advances` · `drivers.penalties` · `limits.max_drivers`

#### Driver list (`/drivers/list`)
- CRUD drivers; On/Off duty toggle
- Types: Full Time / Part Time / Contract / Owner Driver
- Card/list views; filters (type, status, assigned/unassigned)
- License + photo; salary; emergency contact
- Import Excel; export Excel/CSV; template
- Detail view with history

#### Vehicle–driver assignment
- Assign / end assignment via `/driver-assignments`
- History; odometer/reason on unassign

#### Attendance (`/drivers/attendance`)
- Log Present / Late / Absent / On Trip / On Leave
- Check-in/out, duty type, vehicle, hours, notes
- Bulk mark for a date; edit status; date/month/year filters
- Voice fill on log modal

#### Driver expenses (`/drivers/expenses`)
- Categories: Daily Bata, Night Halt, Advance Payout, Overtime, Toll cash, Uniform/Misc
- CRUD; status Approved / Pending / Paid; receipt upload

#### Driver payroll (`/drivers/payroll`)
- Monthly summary: base salary, advances, challans/penalties, absent deductions, net payable
- Give/edit/delete advance; add/edit/delete challan/penalty
- Settle / unsettle salary; payroll detail drawer
- Status: PAID / DUE / ADVANCE RUNNING

**Realtime:** attendance create/update/bulk/delete; driver duty start/end

---

### 3.4 Departments & contracts
**Entitlements:** `departments.contracts` · `departments.duty_logs` · `departments.duty_logs.print` · `departments.monthly_billing` · `departments.weekend_billing` · `departments.payments` · `departments.gst` · `departments.invoice_print`

#### Contracts (`/departments/contracts`)
- CRUD department contracts
- Dept name, contact, vehicle, driver, monthly base, included km/hours, extra rates, dates, status, contract PDF
- Voice fill

#### Daily duty logs (`/departments/duty-logs`)
- CRUD duty slips; approve/reject/pending
- Official dept duty vs Weekend/Off-duty trip
- KM/hours, fuel, toll, officer details, signatures, photos
- Views: slips vs logbook; print logbook / slip
- Weekend package pricing fields

#### Monthly billing (`/departments/billing`)
- Generate monthly tender bills (rent + extras + fuel + night + toll + GST)
- GST: rate, CGST+SGST vs IGST
- Bill statuses: Draft/Sent/Pending/Paid/Overdue
- Print / Save PDF; delete bills

#### Weekend billing (`/departments/weekend-billing`)
- Weekend trip register; free-km vs chargeable
- Generate weekend cash memo bills
- Billing status Unbilled/Billed/Paid

#### Payments (`/departments/payments`)
- Record payments (NEFT, Treasury Challan, Cheque, UPI, etc.)
- Proof upload; status Received/Reconciled/Processing

**Realtime:** duty-log created/updated/deleted

---

### 3.5 Bookings (commercial trips)
**Routes:** `/booking`, `/bookings`  
**Entitlements:** `bookings.crud` · `bookings.complete` · `bookings.payments` · `bookings.availability` · `bookings.live_map` · `bookings.dept_weekend` · `limits.max_bookings_per_month`

- Create booking: customer, route (OSRM + autocomplete), one-way/round, vehicle/driver, fare, advance
- List filters: status, month, date, pending payment, dept-weekend
- Update; status Scheduled/Ongoing/Completed/Cancelled
- Assign driver/vehicle
- Complete trip: end odometer, fuel/FASTag/bata/other costs, balance collection
- Collect payment (partial/full)
- Vehicle availability by date
- Detail modal + BookingLiveMap
- Voice fill on add

**Realtime:** booking created/updated/completed/assigned/unassigned

---

### 3.6 Expenses
**Entitlements:** `expenses.fastag` · `expenses.fuel` · `expenses.all` · `expenses.fastag.recharge`

| Submodule | Route | Capabilities |
|-----------|-------|----------------|
| FASTag | `/expenses/fastag` | Toll deduction + recharge per vehicle; tag/bank/balance; proofs |
| Fuel | `/expenses/fuel` | Litres, rate, station, odometer, payment mode, meter/receipt photos |
| All expenses | `/expenses/all` | Fuel, FASTag/Toll, Driver, Maintenance, General; add general expense |

---

### 3.7 Profitability
**Route:** `/profitability`  
**Entitlements:** `profitability.overview` · `profitability.pnl_ledger` · `profitability.export`

- Trip vs department contribution margins
- Direct costs vs common overheads
- Net profit / margin
- P&L ledger tabs: bookings · departments · overheads
- CSV export of ledger

---

### 3.8 Revenue
**Route:** `/revenue`  
**Entitlements:** `revenue.overview` · `revenue.manual_entry` · `revenue.outstanding` · `revenue.vehicle_economics`

- Tabs: overview · trips · departments · vehicles · outstanding · recent
- Date filters; vehicle/dept/type/payment status
- Time-series chart; vehicle economics
- Manual add revenue; detail modal; edit linked booking
- Collection: received / pending / overdue

---

### 3.9 Compliance
**Route:** `/compliance`  
**Entitlements:** `compliance.vehicle` · `compliance.driver` · `compliance.alerts`

- Vehicle docs: RC, Insurance, PUC, Permit, Auth, Fitness, Tax, etc.
- Driver docs: License, Police, Medical, etc.
- Expiry status: ok / soon / late
- Add / edit / delete; photo/PDF upload; detail viewer
- Feeds sidebar badge + notifications

---

### 3.10 Maintenance
**Route:** `/maintenance`  
**Entitlements:** `maintenance.crud` · `maintenance.bills`

- Log Service / Repair / Tyre Change (+ tyre count)
- Cost, bill attachment, notes, status Completed/In Progress/Scheduled
- Month stats; per-vehicle summary

---

### 3.11 Activity audit
**Route:** `/activity`  
**Entitlements:** `activity.feed` · `activity.export` · `activity.user_stats`

- Agency activity feed + per-user stats
- Filters: user, category, actor type
- CSV export

---

### 3.12 Support reports
**Routes:** `/report`, `/reports`  
**Entitlement:** `support.tickets`

- Tickets: issue / query / feature_request / other
- Priority, module, attachments (≤10MB)
- List/filter by status; detail view

---

### 3.13 Notifications
**Route:** `/notifications`  
**Entitlements:** `notifications.in_app` · `notifications.push` · `notifications.realtime`

- In-app list: compliance, maintenance, fleet, financial, bookings, system
- Mark read / mark all / delete; deep links
- Socket.IO `/notifications`
- FCM push (permission, token register, test push)
- Preference toggles in Profile

---

### 3.14 Profile & settings
**Route:** `/profile`  
**Entitlements:** `profile.self` · `profile.sessions` · `profile.agency_edit`

- Account edit (name, email, phone, avatar)
- Password change
- Agency profile edit (GSTIN, PAN, address, business type, logo)
- Preferences: theme, notification categories
- Device sessions
- Role display only (cannot self-change)

---

## 4. Cross-cutting capabilities

| Capability | Entitlement suggestion |
|------------|------------------------|
| Voice form fill | `ux.voice_fill` |
| File uploads | `ux.uploads` |
| Multi-language UI | `ux.i18n` |
| Dark/light theme | `ux.theme` |
| Live GPS tracking (stub) | `gps.live_tracking` |
| Chat socket (stub) | `chat` |

---

## 5. Roles (today)

Defined on user: `admin` | `manager` | `operator`

| Finding | Detail |
|---------|--------|
| UI gating | **None** — no route/module checks on `user.role` |
| Display | Role badge on Profile / Topbar only |
| Registration | New users registered as `admin` |

**Future:** seats owned by plan; permissions owned by role × unlocked modules.

---

## 6. Plan / subscription status in Admin

| Check | Result |
|-------|--------|
| SaaS plan UI | Not present |
| Entitlement / feature flags | Not present |
| Seat / vehicle / driver quotas | Not present |
| “Billing” in product | Means **customer/department invoicing**, not KABPRO subscription |

---

## 7. Key domain entities

| Entity | Purpose |
|--------|---------|
| Agency | Multi-tenant org (GSTIN, PAN, business type) |
| User | Account + role + sessions |
| Vehicle | Fleet unit (Dept/Trip, FASTag, GPS, docs, P&L) |
| Driver | Roster, license, salary, duty, assignment |
| DriverAssignment | Assign/unassign history |
| DriverAttendance | Daily attendance |
| DriverExpense / Advance / Penalty / PayrollSettlement | Payroll engine |
| DepartmentContract | Tender terms |
| DailyDutyLog | Duty slips + weekend package fields |
| MonthlyDepartmentBill | Monthly or weekend invoices |
| DepartmentPayment | Collections |
| Booking / TripFinancial | Commercial trips |
| FuelLog / FastagTransaction / ExpenseRecord | Cost stack |
| DocumentCompliance | Expiry-tracked docs |
| MaintenanceRecord | Service/repair/tyre |
| RevenueItem | Trip / Department / Manual lines |
| IssueReport | Support tickets |
| ActivityItem | Audit log |
| Notification | In-app + push |

---

## 8. Realtime surface

| Channel | Use |
|---------|-----|
| Socket `/notifications` | New notifs + fleet events into FleetContext |
| Fleet events | Bookings, duty logs, attendance, driver duty |
| Socket `/tracking` | Prepared, not connected in UI |
| Socket `/chat` | Prepared, unused |
| FCM | Push notifications |
| BookingLiveMap | Client-side route/map (not GPS socket) |

---

## 9. Entitlement catalog (for packaging)

```
module.dashboard
agency.multi
agency.create

vehicles.crud
vehicles.bulk_import
vehicles.detail
vehicles.mode_switch
vehicles.live_tracking

drivers.crud
drivers.bulk_import_export
drivers.assignment
drivers.attendance
drivers.attendance.bulk
drivers.expenses
drivers.payroll
drivers.advances
drivers.penalties

departments.contracts
departments.duty_logs
departments.duty_logs.print
departments.monthly_billing
departments.weekend_billing
departments.payments
departments.gst
departments.invoice_print

bookings.crud
bookings.complete
bookings.payments
bookings.availability
bookings.live_map
bookings.dept_weekend

expenses.fastag
expenses.fuel
expenses.all
profitability.overview
profitability.pnl_ledger
profitability.export
revenue.overview
revenue.manual_entry
revenue.outstanding

compliance.vehicle
compliance.driver
compliance.alerts
maintenance.crud
activity.feed
activity.export

notifications.in_app
notifications.push
notifications.realtime
support.tickets
profile.sessions
ux.voice_fill
ux.i18n

limits.max_vehicles
limits.max_drivers
limits.max_agencies
limits.max_contracts
limits.max_bookings_per_month
limits.max_storage_mb
limits.max_users
```

---

*End of Admin Features Catalog*

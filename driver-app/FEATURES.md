# KABPRO Driver App — Features & Screens Build Checklist

Use this file to implement **one item at a time**. Check the box when done.

Legend:
- `[ ]` not started
- `[~]` in progress
- `[x]` done

Scaffold screens already exist under `src/screens/`. Wire APIs and real flows as you go.

---

## Phase 1 — Core

### Screen: Login (`LoginScreen`)
- [x] Identifier + password UI (mobile / email / user ID auto-detect, India country picker)
- [x] Call auth API and store session/token securely
- [x] Navigate to Home on success; show error on failure (local scaffold)
- [x] Persist login and restore session on app launch
- [x] Logout clears session and returns to Login

### Screen: Profile (`ProfileScreen`)
- [x] Show driver name, Driver ID, mobile, licence number, licence validity
- [x] Show profile photo (placeholder then upload/display)
- [x] Show driver status
- [x] Show currently assigned vehicle (number, type, model, vehicle ID)
- [ ] Pull live data from API

### Screen: Home (`HomeScreen`) — basic
- [x] Show driver name
- [x] Show assigned vehicle
- [x] Show duty status (Off duty / On duty)
- [x] Show current odometer / last reading
- [x] Show daily KM
- [x] Quick action: Start Duty / End Duty (based on status)
- [x] Bottom nav: Home, Wallet, SOS, Docs, Profile (wire navigation)

### Screen: Start Duty (`StartDutyScreen`)
- [x] Auto-capture date/time
- [x] Enter starting odometer
- [x] Capture start-odometer photo
- [x] Optional GPS capture
- [x] Submit → create duty log
- [x] Validation: odometer cannot be lower than previous valid reading
- [x] Return to Home with On duty status

### Screen: End Duty (`EndDutyScreen`)
- [x] Auto-capture end time
- [x] Enter ending odometer
- [x] Capture end-odometer photo
- [x] Optional remarks
- [x] Submit → close duty; Total KM = end − start
- [x] Validation: end odometer ≥ start odometer
- [x] Return to Home with Off duty status

### Feature: Duty history (can live on Home or Profile)
- [x] List past duties: date, start/end time, start/end odometer, total KM, photos, status
- [ ] Open duty detail view

---

## Phase 2 — Financial

### Screen: Add Fuel (`AddFuelScreen`)
- [x] Required: date/time, odometer, litres, total cost, pump/meter photo
- [x] Optional: fuel station, fuel type, receipt, remarks, location
- [x] Auto-calc price per litre = cost ÷ litres
- [ ] Validate odometer progression
- [ ] Warn if litres look inconsistent vs tank capacity
- [x] Submit → save fuel entry + photos

### Feature: Fuel history (list on Home or dedicated section)
- [x] Show all fuel entries with values + photos
- [ ] Show efficiency where possible (distance ÷ fuel)

### Screen: Add Expense (`AddExpenseScreen`)
- [x] Category: Toll, Food, Parking, Repair, Loading/Unloading, Vehicle Maintenance, Other
- [x] Fields: amount, date/time, note, receipt photo, location, linked trip
- [x] Receipt photo required
- [x] Submit → status Pending

### Feature: Expense history & status
- [x] List expenses with status: Pending / Approved / Rejected / Paid
- [ ] Daily expense summary
- [ ] Reflect admin approval/rejection updates

### Screen: Advance Request (`AdvanceRequestScreen`)
- [x] Amount requested, reason, date/time, linked trip
- [x] Submit → Pending
- [x] Show statuses: Pending, Approved, Rejected, Paid, Settled
- [x] Show requested / approved / paid / settled amounts

### Screen: Wallet (`WalletScreen`)
- [x] Opening balance
- [x] Advances received, expenses, fuel, adjustments
- [x] Remaining balance
- [x] Full ledger: type, amount, date/time, reference, running balance
- [x] Reconciliation view (e.g. advance − approved expenses = remaining)

---

## Phase 3 — Trip & Identity

### Feature: Trip linking (cross-cutting)
- [x] Link duty, fuel, expense, advance, documents to Trip ID
- [x] Show current trip + trip status on Home

### Screen: Documents (`DocumentsScreen`)
- [x] Document types: Delivery Challan, POD, Invoice, Vehicle Documents, Other
- [x] Upload photo/file
- [x] Store: type, upload time, linked trip, uploader, file metadata
- [x] List uploaded documents by trip

### Screen: Digital ID (`DigitalIdScreen`)
- [x] Show digital ID card (name, photo, ID, vehicle, licence)
- [x] Easy access from Home quick action

### Screen: SOS (`SosScreen`)
- [x] Clear emergency / accident report action
- [x] Capture incident details + optional photo/location
- [x] Submit → visible to admin
- [x] Confirm success to driver

### Screen: Home — complete quick actions
- [x] Add Fuel
- [x] Add Expense
- [x] Trip Documents
- [x] Advance Request
- [x] Digital ID
- [x] Report Accident / SOS

---

## Phase 4 — Reporting

### Feature: Driver reports (in-app or admin-facing)
- [ ] Daily report: duty, KM, fuel qty/cost, avg KM/L, expenses, advances, pending
- [ ] Monthly report (same metrics)
- [ ] Filter/view: driver-wise, vehicle-wise, trip-wise

### Feature: Admin visibility (dashboard/backend — not mobile UI)
- [ ] Admin sees driver, vehicle, duty, odometer, KM, fuel, expenses, advances
- [ ] Driver detail tabs: Profile, Duty, Fuel, Expenses, Advances, Documents, Timeline

---

## Phase 5 — Reliability & Production

### Feature: Photo & file storage
- [ ] Upload to durable object storage (not local-only URLs)
- [ ] Persist URL/key, type, size, timestamp, uploader, linked record

### Feature: Notifications
- [ ] Advance approved/rejected
- [ ] Expense approved/rejected
- [ ] Trip assigned/updated
- [ ] Duty reminders
- [ ] Fuel / document / settlement reminders

### Feature: Offline & sync
- [ ] Offline capture for key actions (duty, fuel, expense)
- [ ] Local queue of unsynced records
- [ ] Auto-sync when online
- [ ] Sync status UI
- [ ] Conflict handling (no silent data loss)

### Feature: Audit trail (mostly backend)
- [ ] Log create / update / approve / reject / settle
- [ ] Store user, timestamp, record, old/new value

### Feature: Security & validation
- [ ] Role-based access (Driver vs Admin/Finance)
- [ ] APIs enforce driver can only access own records
- [ ] Server-side validation: odometer, litres, cost, amounts
- [ ] Auto timestamps; restrict manual date edits
- [ ] Idempotency / prevent duplicate submits

---

## Suggested build order (one by one)

| Step | Phase | Item |
|------|-------|------|
| 1 | 1 | Login auth |
| 2 | 1 | Profile + assigned vehicle |
| 3 | 1 | Home basic dashboard |
| 4 | 1 | Start Duty |
| 5 | 1 | End Duty + duty history |
| 6 | 2 | Add Fuel + fuel history |
| 7 | 2 | Add Expense + expense history |
| 8 | 2 | Advance Request |
| 9 | 2 | Wallet ledger |
| 10 | 3 | Trip linking + Home trip info |
| 11 | 3 | Documents |
| 12 | 3 | Digital ID |
| 13 | 3 | SOS |
| 14 | 4 | Reports |
| 15 | 5 | Photos storage, notifications, offline, audit, security |

---

## Screen ↔ file map

| Screen | File |
|--------|------|
| Login | `src/screens/LoginScreen.tsx` |
| Home | `src/screens/HomeScreen.tsx` |
| Start Duty | `src/screens/StartDutyScreen.tsx` |
| End Duty | `src/screens/EndDutyScreen.tsx` |
| Add Fuel | `src/screens/AddFuelScreen.tsx` |
| Add Expense | `src/screens/AddExpenseScreen.tsx` |
| Advance Request | `src/screens/AdvanceRequestScreen.tsx` |
| Wallet | `src/screens/WalletScreen.tsx` |
| Documents | `src/screens/DocumentsScreen.tsx` |
| Profile | `src/screens/ProfileScreen.tsx` |
| Digital ID | `src/screens/DigitalIdScreen.tsx` |
| SOS | `src/screens/SosScreen.tsx` |

---

## Core data entities (backend)

`drivers` · `vehicles` · `driver_vehicle_assignments` · `trips` · `duty_logs` · `fuel_entries` · `expenses` · `advances` · `documents` · `transactions` · `notifications` · `audit_logs`

---

**Next up:** Wire login auth to the API (phone/email/user ID + password/Google → token → Home). Local screen flows now work with in-app session data.

# KABPRO Product Documentation

**Product:** KABPRO Fleet Operating System  
**Scope:** Admin (fleet), Superadmin (platform), Plans / entitlements / trials  
**Last updated:** 2026-09-16

This folder is the source of truth for product planning and commercial packaging. Each document is available as **Markdown (`.md`)** and **PDF (`.pdf`)**.

---

## Documents

| # | Document | Markdown | PDF | Purpose |
|---|----------|----------|-----|---------|
| 1 | Admin Features Catalog | [01-ADMIN-FEATURES.md](./01-ADMIN-FEATURES.md) | [01-ADMIN-FEATURES.pdf](./01-ADMIN-FEATURES.pdf) | Full inventory of fleet Admin modules, routes, entities, realtime |
| 2 | Plan & Entitlements Blueprint | [02-PLAN-ENTITLEMENTS-BLUEPRINT.md](./02-PLAN-ENTITLEMENTS-BLUEPRINT.md) | [02-PLAN-ENTITLEMENTS-BLUEPRINT.pdf](./02-PLAN-ENTITLEMENTS-BLUEPRINT.pdf) | Dynamic pricing, feature matrix, seats, trial timeline, roadmap |
| 3 | Superadmin Platform Guide | [03-SUPERADMIN-PLATFORM.md](./03-SUPERADMIN-PLATFORM.md) | [03-SUPERADMIN-PLATFORM.pdf](./03-SUPERADMIN-PLATFORM.pdf) | Platform console: orgs, leads, plans, reports, auth |
| 4 | Subscription Data Model | [04-SUBSCRIPTION-DATA-MODEL.md](./04-SUBSCRIPTION-DATA-MODEL.md) | [04-SUBSCRIPTION-DATA-MODEL.pdf](./04-SUBSCRIPTION-DATA-MODEL.pdf) | Schemas, APIs, enforcement design |

### Implementation how-to (`docs/implementation/`)

Engineering guides for how to **build and consume** plans across Server, Admin, Landing, and Superadmin:

| # | Document | Purpose |
|---|----------|---------|
| — | [implementation/README.md](./implementation/README.md) | Index |
| 0 | [00-IMPLEMENTATION-OVERVIEW.md](./implementation/00-IMPLEMENTATION-OVERVIEW.md) | End-to-end flow |
| 1 | [01-SERVER-IMPLEMENTATION.md](./implementation/01-SERVER-IMPLEMENTATION.md) | API resolve + enforce |
| 2 | [02-ADMIN-DASHBOARD-CONSUMPTION.md](./implementation/02-ADMIN-DASHBOARD-CONSUMPTION.md) | EntitlementProvider + gates |
| 3 | [03-LANDING-PAGE-CONSUMPTION.md](./implementation/03-LANDING-PAGE-CONSUMPTION.md) | Dynamic pricing + leads |
| 4 | [04-SUPERADMIN-CATALOG-OPS.md](./implementation/04-SUPERADMIN-CATALOG-OPS.md) | Catalog matrix + timeline |
| 5 | [05-PHASED-CHECKLIST.md](./implementation/05-PHASED-CHECKLIST.md) | P0–P5 shipping checklist |

---

## Domains

| Surface | URL (production) | App folder |
|---------|------------------|------------|
| Landing | https://kabpro.pro | `landing/` |
| Admin | https://admin.kabpro.pro | `admin/` |
| Superadmin | https://superadmin.kabpro.pro | `superadmin/` |
| API | https://api.kabpro.pro | `server/` |

Server ops docs remain under `server/docs/` (deployment, domain cutover).

---

## Current commercial status

| Capability | Status |
|------------|--------|
| Country-based plan catalog (Superadmin) | Implemented |
| Benefits + soft limits on plans | Implemented |
| Assign trial / subscription (Superadmin) | Implemented |
| Machine entitlement keys (feature matrix) | **Not yet** |
| Admin plan page / trial banner | **Not yet** |
| API / UI enforcement of limits & modules | **Not yet** |
| Seat packs / RBAC by role | **Not yet** |
| Self-serve payments | **Not yet** |

**Recommended build order:** P0 Catalog truth → P1 Show in Admin → P2 Enforce → P3 Trial cron → P4 Seats → P5 Payments.  
See document **02** for detail.

---

## Regenerating PDFs

From repo root (requires `server` dependencies, including `pdf-lib`):

```bash
node docs/scripts/generate-pdfs.js
```

Markdown is the editable source; PDFs are generated artifacts.

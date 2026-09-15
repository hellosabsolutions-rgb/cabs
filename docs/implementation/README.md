# Implementation guides

How to **implement** the KABPRO plan / entitlements system and **consume** it across:

| Surface | Folder | Role |
|---------|--------|------|
| Server / API | `server/` | Source of truth, resolve + enforce |
| Admin dashboard | `admin/` | Gate modules, show trial / usage |
| Landing | `landing/` | Public pricing + lead capture |
| Superadmin | `superadmin/` | Catalog + assign trials (already partial) |

Product specs live one level up in `docs/` (`01`–`04`). This folder is the **engineering how-to**.

---

## Documents

| # | File | Purpose |
|---|------|---------|
| 0 | [00-IMPLEMENTATION-OVERVIEW.md](./00-IMPLEMENTATION-OVERVIEW.md) | End-to-end flow, phases, ownership |
| 1 | [01-SERVER-IMPLEMENTATION.md](./01-SERVER-IMPLEMENTATION.md) | Models, resolve service, middleware, public + billing APIs |
| 2 | [02-ADMIN-DASHBOARD-CONSUMPTION.md](./02-ADMIN-DASHBOARD-CONSUMPTION.md) | EntitlementProvider, nav gates, trial banner, quota UX |
| 3 | [03-LANDING-PAGE-CONSUMPTION.md](./03-LANDING-PAGE-CONSUMPTION.md) | Dynamic pricing from API, country, inquiry → lead |
| 4 | [04-SUPERADMIN-CATALOG-OPS.md](./04-SUPERADMIN-CATALOG-OPS.md) | Extend plan editor, seed entitlements, org timeline |
| 5 | [05-PHASED-CHECKLIST.md](./05-PHASED-CHECKLIST.md) | P0–P5 task checklist for shipping |

---

## Golden rule

```
Landing  = marketing view of catalog (benefits + prices)
Admin    = runtime view of resolved entitlements (features + limits + usage)
Server   = only place that decides allow / deny
Superadmin = edits catalog and subscriptions
```

Never trust the client alone for feature access.

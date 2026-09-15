# 03 — Landing page consumption

How the **marketing site** (`landing/`) consumes the plan catalog for pricing and leads.

**App:** https://kabpro.pro · local typically `:3001`  
**Today:** `landing/app/components/Pricing.tsx` uses a **hardcoded** `plans` array (Starter / Professional / Enterprise).

---

## 1. Goals

1. Pricing section shows **live** Superadmin catalog for a country  
2. Country (or currency) selector for multi-market pricing  
3. CTA opens inquiry / trial with **interested plan code**  
4. Inquiry creates a **PlatformLead** (or existing inquiry API) visible in Superadmin  
5. Landing never enforces entitlements — marketing only  

---

## 2. Current Pricing.tsx (baseline)

Hardcoded cards:
- Starter — Free forever  
- Professional — ₹2,999 / month (featured)  
- Enterprise — Custom  

This will **drift** from Superadmin seeds unless replaced by API.

---

## 3. Public API contract

Server must expose (see `01-SERVER-IMPLEMENTATION.md`):

```
GET /api/public/plans?country=IN
```

Env on Landing (Next.js):

```env
NEXT_PUBLIC_API_URL=https://api.kabpro.pro/api
# or http://localhost:5000/api in development
```

CORS: API allows `https://kabpro.pro`, `https://www.kabpro.pro`, and localhost landing origin.

---

## 4. Implementation plan (Landing)

### 4.1 Fetch helper

`landing/app/lib/plans.ts`

```ts
export type PublicPlan = {
  code: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  pricingLabel?: string;
  currency: string;
  trialDays: number;
  featured: boolean;
  benefits: { title: string; detail?: string }[];
  limits?: { vehicles?: number; drivers?: number; users?: number };
};

export async function fetchPublicPlans(country: string): Promise<PublicPlan[]> {
  const base = process.env.NEXT_PUBLIC_API_URL;
  const res = await fetch(`${base}/public/plans?country=${country}`, {
    next: { revalidate: 300 }, // ISR-friendly if called from server
  });
  if (!res.ok) throw new Error('Failed to load plans');
  const data = await res.json();
  return data.plans || [];
}
```

Prefer **server component fetch** or route handler to avoid exposing unnecessary client logic; keep Pricing as client only if country toggle needs interactivity.

### 4.2 Replace hardcoded cards

In `Pricing.tsx`:
1. State: `country` default `IN` (detect from locale / query `?country=` later)  
2. Load plans on mount / country change  
3. Map `benefits` → feature list (fallback to empty + “Contact sales”)  
4. Format price with currency symbol map (INR → ₹, AED → د.إ, USD → $)  
5. `pricingLabel` overrides numeric display (`Free`, `Custom`)  
6. Skeleton / error → keep last good cache or static fallback for resilience  

### 4.3 Country switcher

Simple chips: IN · AE · US (extend from API later via `GET /api/public/markets` if added).

Changing country refetches plans — prices and benefit text can differ per market.

### 4.4 CTA wiring

| Plan type | CTA | Action |
|-----------|-----|--------|
| Free / Starter with 0 price | Start Free | Link to `https://admin.kabpro.pro/register` or `#inquiry` with plan code |
| Paid with trialDays | Start Free Trial | Inquiry prefilled `interestedPlan=CODE` or Admin register |
| Custom / Enterprise | Contact Sales | Scroll to `InquiryForm` with plan code |

Pass plan code via:
- Query: `/#inquiry?plan=PROFESSIONAL`  
- Or React state lift between Pricing and InquiryForm  

### 4.5 Inquiry → Superadmin lead

**Option A (preferred):**  
`POST /api/public/leads` (new public, rate-limited) → creates `PlatformLead` with `source: 'Landing'`, `interestedPlan`.

**Option B:**  
Existing inquiry email / form endpoint; Superadmin imports later (weaker).

InquiryForm fields should include hidden/select **Interested plan**.

---

## 5. Content rules (keep Landing honest)

| Show on Landing | Do not show |
|-----------------|-------------|
| Name, description, benefits | Internal entitlement keys |
| Monthly / yearly price | Soft-limit internals unless marketed (“Up to 50 vehicles”) |
| Trial length | Org-specific overrides |
| Featured flag | Inactive plans |

Limits may appear as benefit text (“Up to 100 vehicles”) derived from `limits.vehicles` if product wants auto-copy.

---

## 6. FAQ / Navbar consistency

- Navbar already links `#pricing` — keep  
- FAQ subscription payment wording should match real checkout status (today: “contact / trial”; update when P5 payments land)  
- Footer Pricing link unchanged  

---

## 7. Fallback strategy

If API down:
1. Show cached ISR page if using Next revalidate  
2. Else fall back to minimal static 3-tier copy marked “indicative”  
3. Never block the whole landing on pricing failure — degrade Pricing section only  

---

## 8. Implementation checklist (Landing)

- [ ] Add `NEXT_PUBLIC_API_URL` to landing env examples  
- [ ] Implement `fetchPublicPlans`  
- [ ] Refactor `Pricing.tsx` to API-driven cards + country toggle  
- [ ] Wire CTA → InquiryForm with `interestedPlan`  
- [ ] Add public lead API (server) + connect form  
- [ ] Verify CORS from kabpro.pro → api.kabpro.pro  
- [ ] QA: change Superadmin IN Professional price → Landing updates within cache TTL  

---

## 9. Out of scope for Landing

- Login / JWT  
- Entitlement enforcement  
- Usage meters  
- Seat management  

Those belong to Admin + Server only.

---

*Next: [04-SUPERADMIN-CATALOG-OPS.md](./04-SUPERADMIN-CATALOG-OPS.md)*

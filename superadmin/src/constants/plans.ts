export const PLAN_CATEGORIES = [
  'Free',
  'Starter',
  'Professional',
  'Growth',
  'Enterprise',
  'Custom',
] as const;

export type PlanCategory = (typeof PLAN_CATEGORIES)[number];

export const PLAN_MARKETS = [
  { country: 'IN', countryName: 'India', currency: 'INR', symbol: '₹' },
  { country: 'AE', countryName: 'United Arab Emirates', currency: 'AED', symbol: 'د.إ' },
  { country: 'US', countryName: 'United States', currency: 'USD', symbol: '$' },
  { country: 'GB', countryName: 'United Kingdom', currency: 'GBP', symbol: '£' },
  { country: 'SG', countryName: 'Singapore', currency: 'SGD', symbol: 'S$' },
  { country: 'AU', countryName: 'Australia', currency: 'AUD', symbol: 'A$' },
  { country: 'CA', countryName: 'Canada', currency: 'CAD', symbol: 'C$' },
  { country: 'SA', countryName: 'Saudi Arabia', currency: 'SAR', symbol: '﷼' },
] as const;

export function marketFor(country?: string) {
  return PLAN_MARKETS.find((m) => m.country === (country || '').toUpperCase()) || PLAN_MARKETS[0];
}

export function formatPlanPrice(
  amount: number,
  currency: string,
  pricingLabel?: string
) {
  if (pricingLabel) return pricingLabel;
  if (!amount) return 'Free';
  const m = PLAN_MARKETS.find((x) => x.currency === currency);
  const symbol = m?.symbol || `${currency} `;
  return `${symbol}${amount.toLocaleString()}`;
}

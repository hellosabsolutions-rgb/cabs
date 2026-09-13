export type Country = {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
};

export const INDIA: Country = {
  code: 'IN',
  name: 'India',
  dialCode: '91',
  flag: '🇮🇳',
};

export const COUNTRIES: Country[] = [
  INDIA,
  { code: 'AE', name: 'United Arab Emirates', dialCode: '971', flag: '🇦🇪' },
  { code: 'AF', name: 'Afghanistan', dialCode: '93', flag: '🇦🇫' },
  { code: 'AU', name: 'Australia', dialCode: '61', flag: '🇦🇺' },
  { code: 'BD', name: 'Bangladesh', dialCode: '880', flag: '🇧🇩' },
  { code: 'BH', name: 'Bahrain', dialCode: '973', flag: '🇧🇭' },
  { code: 'BT', name: 'Bhutan', dialCode: '975', flag: '🇧🇹' },
  { code: 'CA', name: 'Canada', dialCode: '1', flag: '🇨🇦' },
  { code: 'CN', name: 'China', dialCode: '86', flag: '🇨🇳' },
  { code: 'DE', name: 'Germany', dialCode: '49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dialCode: '33', flag: '🇫🇷' },
  { code: 'GB', name: 'United Kingdom', dialCode: '44', flag: '🇬🇧' },
  { code: 'ID', name: 'Indonesia', dialCode: '62', flag: '🇮🇩' },
  { code: 'IE', name: 'Ireland', dialCode: '353', flag: '🇮🇪' },
  { code: 'IT', name: 'Italy', dialCode: '39', flag: '🇮🇹' },
  { code: 'JP', name: 'Japan', dialCode: '81', flag: '🇯🇵' },
  { code: 'KE', name: 'Kenya', dialCode: '254', flag: '🇰🇪' },
  { code: 'KR', name: 'South Korea', dialCode: '82', flag: '🇰🇷' },
  { code: 'KW', name: 'Kuwait', dialCode: '965', flag: '🇰🇼' },
  { code: 'LK', name: 'Sri Lanka', dialCode: '94', flag: '🇱🇰' },
  { code: 'MV', name: 'Maldives', dialCode: '960', flag: '🇲🇻' },
  { code: 'MY', name: 'Malaysia', dialCode: '60', flag: '🇲🇾' },
  { code: 'NP', name: 'Nepal', dialCode: '977', flag: '🇳🇵' },
  { code: 'NZ', name: 'New Zealand', dialCode: '64', flag: '🇳🇿' },
  { code: 'OM', name: 'Oman', dialCode: '968', flag: '🇴🇲' },
  { code: 'PH', name: 'Philippines', dialCode: '63', flag: '🇵🇭' },
  { code: 'PK', name: 'Pakistan', dialCode: '92', flag: '🇵🇰' },
  { code: 'QA', name: 'Qatar', dialCode: '974', flag: '🇶🇦' },
  { code: 'SA', name: 'Saudi Arabia', dialCode: '966', flag: '🇸🇦' },
  { code: 'SG', name: 'Singapore', dialCode: '65', flag: '🇸🇬' },
  { code: 'TH', name: 'Thailand', dialCode: '66', flag: '🇹🇭' },
  { code: 'US', name: 'United States', dialCode: '1', flag: '🇺🇸' },
  { code: 'ZA', name: 'South Africa', dialCode: '27', flag: '🇿🇦' },
];

export function findCountry(code: string): Country {
  return COUNTRIES.find((item) => item.code === code) ?? INDIA;
}

export function matchCountryByDialPrefix(value: string): Country | null {
  const digits = value.replace(/[\s\-()]/g, '');
  if (!digits.startsWith('+')) return null;

  const rest = digits.slice(1);
  let best: Country | null = null;

  for (const country of COUNTRIES) {
    if (!rest.startsWith(country.dialCode)) continue;
    if (!best || country.dialCode.length > best.dialCode.length) {
      best = country;
    }
  }

  return best;
}

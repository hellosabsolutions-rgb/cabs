export type ColorTokens = {
  bg: string;
  surface: string;
  surfaceMuted: string;
  border: string;
  borderSoft: string;
  text: string;
  textDim: string;
  textFaint: string;
  accent: string;
  accentMuted: string;
  accentText: string;
  success: string;
  danger: string;
  dangerBg: string;
  dangerBorder: string;
  warning: string;
  warningBg: string;
};

export const lightColors: ColorTokens = {
  bg: '#F7F7F7',
  surface: '#FFFFFF',
  surfaceMuted: '#F0F0F0',
  border: '#E7E7E7',
  borderSoft: '#EEEEEE',
  text: '#0B0B0B',
  textDim: '#333333',
  textFaint: '#A5A5A5',
  accent: '#1687F5',
  accentMuted: '#E8F4FE',
  accentText: '#FFFFFF',
  success: '#26B8D8',
  danger: '#F15B4A',
  dangerBg: '#FDECEA',
  dangerBorder: '#F7C5C0',
  warning: '#C9A227',
  warningBg: '#FFF8D6',
};

export const darkColors: ColorTokens = {
  bg: '#0B0B0B',
  surface: '#161616',
  surfaceMuted: '#1C1C1C',
  border: '#333333',
  borderSoft: '#2A2A2A',
  text: '#FFFFFF',
  textDim: '#A5A5A5',
  textFaint: '#6E6E6E',
  accent: '#1687F5',
  accentMuted: '#12314F',
  accentText: '#FFFFFF',
  success: '#26B8D8',
  danger: '#F15B4A',
  dangerBg: '#3A1814',
  dangerBorder: '#5A2A24',
  warning: '#C9A227',
  warningBg: '#3A3510',
};

/** Default (light) tokens for static fallbacks. */
export const colors = lightColors;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const radius = {
  sm: 8,
  md: 10,
  lg: 12,
  xl: 14,
  pill: 999,
};

export function getType(c: ColorTokens) {
  return {
    pageTitle: {
      fontSize: 20,
      fontWeight: '600' as const,
      color: c.text,
      letterSpacing: -0.3,
    },
    section: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: c.text,
    },
    body: {
      fontSize: 13,
      color: c.textDim,
      lineHeight: 19,
    },
    label: {
      fontSize: 11,
      fontWeight: '600' as const,
      color: c.textFaint,
      letterSpacing: 0.2,
    },
    value: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: c.text,
    },
    meta: {
      fontSize: 12,
      color: c.textFaint,
    },
  };
}

export const type = getType(lightColors);

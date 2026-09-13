const API_BASE =
  import.meta.env.VITE_API_URL ||
  (import.meta.env.DEV ? '/api' : 'https://api.kabpro.pro/api');

export const API_URL = API_BASE.replace(/\/$/, '');

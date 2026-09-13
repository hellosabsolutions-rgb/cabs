export interface LanguageInfo {
  code: string;
  name: string;
  native: string;
  region: string;
}

export const INDIAN_LANGUAGES: LanguageInfo[] = [
  { code: 'en', name: 'English', native: 'English', region: 'Pan-India / International' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', region: 'North / Central India' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা', region: 'West Bengal / Tripura' },
  { code: 'mr', name: 'Marathi', native: 'मराठी', region: 'Maharashtra' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', region: 'Andhra Pradesh / Telangana' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்', region: 'Tamil Nadu / Puducherry' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી', region: 'Gujarat' },
  { code: 'ur', name: 'Urdu', native: 'اردو', region: 'Pan-India' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', region: 'Karnataka' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ', region: 'Odisha' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം', region: 'Kerala / Lakshadweep' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ', region: 'Punjab / Chandigarh' },
  { code: 'as', name: 'Assamese', native: 'অসমীয়া', region: 'Assam' },
  { code: 'mai', name: 'Maithili', native: 'मैथिली', region: 'Bihar / Jharkhand' },
  { code: 'sat', name: 'Santali', native: 'ᱥᱟᱱᱛᱟᱲᱤ', region: 'Jharkhand / Odisha / WB' },
  { code: 'ks', name: 'Kashmiri', native: 'کٲشُر', region: 'Jammu & Kashmir' },
  { code: 'ne', name: 'Nepali', native: 'नेपाली', region: 'Sikkim / West Bengal' },
  { code: 'kok', name: 'Konkani', native: 'कोंकणी', region: 'Goa / Maharashtra' },
  { code: 'sd', name: 'Sindhi', native: 'سنڌي', region: 'Pan-India' },
  { code: 'doi', name: 'Dogri', native: 'डोगरी', region: 'Jammu & Kashmir' },
  { code: 'brx', name: 'Bodo', native: 'बड़ो', region: 'Assam / Bodoland' },
  { code: 'mni', name: 'Manipuri', native: 'মৈতৈলোন্', region: 'Manipur' },
  { code: 'sa', name: 'Sanskrit', native: 'संस्कृतम्', region: 'Classical Indian' },
];

export type AppLanguage = (typeof INDIAN_LANGUAGES)[number]['code'];

export function isAppLanguage(value: string): value is AppLanguage {
  return INDIAN_LANGUAGES.some((lang) => lang.code === value);
}

export function getLanguage(code: string): LanguageInfo {
  return INDIAN_LANGUAGES.find((lang) => lang.code === code) ?? INDIAN_LANGUAGES[0];
}

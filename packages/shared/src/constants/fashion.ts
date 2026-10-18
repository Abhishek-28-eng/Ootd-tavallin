// ============================================================
// Fashion Constants — Style Categories, Occasions, Colors, Fits
// These are the core taxonomy entries for Tavallin
// ============================================================

export const STYLE_CATEGORIES = [
  'korean_streetwear',
  'minimalist',
  'casual',
  'smart_casual',
  'streetwear',
  'ethnic_traditional',
  'festive',
  'formal',
  'business_casual',
  'athleisure',
  'bohemian',
  'vintage',
  'y2k',
  'dark_academia',
  'cottagecore',
  'preppy',
  'grunge',
  'romantic',
  'androgynous',
  'eclectic',
] as const;

export type StyleCategory = (typeof STYLE_CATEGORIES)[number];

export const OCCASIONS = [
  'everyday',
  'college',
  'work',
  'date_night',
  'party',
  'wedding',
  'festive_puja',
  'gym_fitness',
  'travel',
  'beach',
  'formal_event',
  'outdoor',
  'night_out',
  'brunch',
  'home_cozy',
] as const;

export type Occasion = (typeof OCCASIONS)[number];

export const COLOR_PREFERENCES = [
  'neutrals',        // white, black, grey, beige
  'earth_tones',     // brown, terracotta, olive
  'pastels',         // soft pink, lavender, mint
  'bold_brights',    // red, cobalt, electric green
  'monochrome',      // single-color outfits
  'prints_patterns', // stripes, floral, abstract
  'metallics',       // gold, silver
  'dark_tones',      // navy, deep burgundy
] as const;

export type ColorPreference = (typeof COLOR_PREFERENCES)[number];

export const FIT_PREFERENCES = [
  'oversized',
  'fitted',
  'slim',
  'relaxed',
  'cropped',
  'flowy',
  'structured',
  'layered',
] as const;

export type FitPreference = (typeof FIT_PREFERENCES)[number];

export const STYLE_CATEGORY_LABELS: Record<StyleCategory, string> = {
  korean_streetwear: 'Korean Streetwear',
  minimalist: 'Minimalist',
  casual: 'Casual',
  smart_casual: 'Smart Casual',
  streetwear: 'Streetwear',
  ethnic_traditional: 'Ethnic & Traditional',
  festive: 'Festive',
  formal: 'Formal',
  business_casual: 'Business Casual',
  athleisure: 'Athleisure',
  bohemian: 'Bohemian',
  vintage: 'Vintage',
  y2k: 'Y2K',
  dark_academia: 'Dark Academia',
  cottagecore: 'Cottagecore',
  preppy: 'Preppy',
  grunge: 'Grunge',
  romantic: 'Romantic',
  androgynous: 'Androgynous',
  eclectic: 'Eclectic',
};

export const OCCASION_LABELS: Record<Occasion, string> = {
  everyday: 'Everyday',
  college: 'College',
  work: 'Work',
  date_night: 'Date Night',
  party: 'Party',
  wedding: 'Wedding',
  festive_puja: 'Festive & Puja',
  gym_fitness: 'Gym & Fitness',
  travel: 'Travel',
  beach: 'Beach',
  formal_event: 'Formal Event',
  outdoor: 'Outdoor',
  night_out: 'Night Out',
  brunch: 'Brunch',
  home_cozy: 'Home & Cozy',
};

export const COLOR_LABELS: Record<ColorPreference, string> = {
  neutrals: 'Neutrals',
  earth_tones: 'Earth Tones',
  pastels: 'Pastels',
  bold_brights: 'Bold & Brights',
  monochrome: 'Monochrome',
  prints_patterns: 'Prints & Patterns',
  metallics: 'Metallics',
  dark_tones: 'Dark Tones',
};

export const FIT_LABELS: Record<FitPreference, string> = {
  oversized: 'Oversized',
  fitted: 'Fitted',
  slim: 'Slim',
  relaxed: 'Relaxed',
  cropped: 'Cropped',
  flowy: 'Flowy',
  structured: 'Structured',
  layered: 'Layered',
};

export const SUPPORTED_CURRENCIES = ['INR', 'USD', 'EUR', 'GBP', 'AED'] as const;
export type SupportedCurrency = (typeof SUPPORTED_CURRENCIES)[number];

export const CURRENCY_SYMBOLS: Record<SupportedCurrency, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  AED: 'د.إ',
};

export const POPULAR_INDIAN_BRANDS = [
  'Zara',
  'H&M',
  'Mango',
  'FabIndia',
  'W for Woman',
  'Biba',
  'Global Desi',
  'Forever 21',
  'Roadster',
  'Myntra Fashion',
  'ONLY',
  'Vero Moda',
  'Jack & Jones',
  'Allen Solly',
  'Van Heusen',
  'Peter England',
  'United Colors of Benetton',
  'Levis',
  'Wrangler',
  'Pepe Jeans',
] as const;

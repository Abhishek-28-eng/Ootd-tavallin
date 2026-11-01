// ============================================================
// Tavallin Design Tokens — Luxury Haute-Couture Edition
// Single source of truth for colors, typography, spacing
// ============================================================

export const Colors = {
  // ─── Core Palette ─────────────────────────────────────────
  obsidian: '#0A0A0C',       // deepest black
  charcoal: '#1C1C1E',       // primary dark
  ink: '#2C2C2E',            // secondary dark
  warmWhite: '#FAF8F5',      // primary background
  cream: '#F5F0E8',          // warm cream
  softGray: '#F0EDE8',       // light surface
  midGray: '#C4BEB6',        // mid tone
  darkGray: '#6E6860',       // secondary text

  // ─── Gold & Luxury Accents ───────────────────────────────
  gold: '#C9A84C',           // primary gold
  goldBright: '#E2B84A',     // bright gold
  goldLight: '#F0DCA0',      // light gold
  goldMuted: '#A88A45',      // muted gold
  goldDust: 'rgba(201,168,76,0.15)', // gold overlay

  // ─── Champagne & Warm Tones ──────────────────────────────
  champagne: '#EFD9B4',
  blush: '#E8D0BC',
  blushLight: '#F5EAE0',
  rose: '#D4A0A0',

  // ─── Glass & Overlay ─────────────────────────────────────
  glassLight: 'rgba(250,248,245,0.90)',
  glassMid: 'rgba(250,248,245,0.75)',
  glassDark: 'rgba(10,10,12,0.82)',
  glassGold: 'rgba(201,168,76,0.12)',
  backdropBlur: 'rgba(0,0,0,0.55)',
  glassBorder: 'rgba(255,255,255,0.18)',
  glassBorderDark: 'rgba(255,255,255,0.07)',

  // ─── Semantic ────────────────────────────────────────────
  background: '#FAF8F5',
  surface: '#FFFFFF',
  surfaceElevated: '#F7F4EF',
  surfaceCard: '#FEFCF9',
  border: '#E5E0D8',
  borderLight: '#EDEBE6',
  borderGold: 'rgba(201,168,76,0.35)',

  // ─── Text ────────────────────────────────────────────────
  textPrimary: '#1C1C1E',
  textSecondary: '#6E6860',
  textTertiary: '#A09890',
  textInverse: '#FEFEFE',
  textGold: '#B8902C',
  textPlaceholder: '#B8B0A6',

  // ─── Interactive ─────────────────────────────────────────
  interactive: '#1C1C1E',
  interactiveHover: '#2D2D30',
  interactiveDisabled: '#C4BEB6',

  // ─── Feedback ────────────────────────────────────────────
  success: '#2E7D32',
  successLight: '#E8F5E9',
  error: '#C62828',
  errorLight: '#FFEBEE',
  warning: '#E65100',
  warningLight: '#FFF3E0',
  info: '#01579B',
  infoLight: '#E1F5FE',

  // ─── Social ──────────────────────────────────────────────
  likeActive: '#C62828',
  likeInactive: '#1C1C1E',
  saveActive: '#C9A84C',
  saveInactive: '#1C1C1E',

  // ─── Dark Theme ──────────────────────────────────────────
  dark: {
    background: '#0A0A0C',
    surface: '#141416',
    surfaceElevated: '#1C1C1E',
    border: '#2C2C2E',
    borderLight: '#242424',
    textPrimary: '#FAF8F5',
    textSecondary: '#A09890',
    gold: '#D4AF62',
  },
} as const;

export const Typography = {
  // Font families (loaded via expo-font)
  fontDisplay: 'CormorantGaramond',   // serif editorial
  fontBody: 'Inter',                   // clean sans-serif

  // Type Scale
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 19,
  xl: 22,
  '2xl': 26,
  '3xl': 32,
  '4xl': 40,
  '5xl': 52,

  // Line Heights
  lineHeightTight: 1.15,
  lineHeightBase: 1.5,
  lineHeightRelaxed: 1.7,
  lineHeightLoose: 2.0,

  // Letter Spacing
  letterSpacingTight: -0.5,
  letterSpacingBase: 0,
  letterSpacingWide: 0.5,
  letterSpacingXWide: 1.2,
  letterSpacingUltra: 2.5,
  letterSpacingMega: 4.0,
} as const;

export const Spacing = {
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
  20: 80,
  24: 96,
} as const;

export const Radii = {
  none: 0,
  xs: 2,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  '2xl': 24,
  '3xl': 32,
  full: 9999,
} as const;

export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  xs: {
    shadowColor: '#1C1C1E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  sm: {
    shadowColor: '#1C1C1E',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  md: {
    shadowColor: '#1C1C1E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1C1C1E',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.10,
    shadowRadius: 20,
    elevation: 8,
  },
  xl: {
    shadowColor: '#0A0A0C',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.14,
    shadowRadius: 28,
    elevation: 12,
  },
  gold: {
    shadowColor: '#C9A84C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

export const Timing = {
  instant: 100,
  fast: 180,
  base: 280,
  slow: 420,
  verySlow: 640,
} as const;

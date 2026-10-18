// ============================================================
// Tavallin Design Tokens
// Single source of truth for colors, typography, spacing
// ============================================================

export const Colors = {
  // ─── Primary Palette ─────────────────────────────────────
  charcoal: '#1A1A1A',
  warmWhite: '#FAF9F7',
  softGray: '#F2F0EE',
  midGray: '#C8C5C0',
  darkGray: '#6B6860',

  // ─── Accent ──────────────────────────────────────────────
  blush: '#E8D5C4',
  blushLight: '#F5EDE5',
  sage: '#C4D4C8',

  // ─── Semantic ────────────────────────────────────────────
  background: '#FAF9F7',
  surface: '#FFFFFF',
  surfaceElevated: '#F8F6F4',
  border: '#E8E5E0',
  borderLight: '#F0EDE9',

  // ─── Text ────────────────────────────────────────────────
  textPrimary: '#1A1A1A',
  textSecondary: '#6B6860',
  textTertiary: '#A09A94',
  textInverse: '#FFFFFF',
  textPlaceholder: '#B8B3AE',

  // ─── Interactive ─────────────────────────────────────────
  interactive: '#1A1A1A',
  interactiveHover: '#2D2D2D',
  interactiveDisabled: '#C8C5C0',

  // ─── Feedback ────────────────────────────────────────────
  success: '#4CAF50',
  successLight: '#E8F5E9',
  error: '#E53935',
  errorLight: '#FFEBEE',
  warning: '#FF8F00',
  warningLight: '#FFF8E1',
  info: '#1976D2',
  infoLight: '#E3F2FD',

  // ─── Social ──────────────────────────────────────────────
  likeActive: '#E53935',
  likeInactive: '#1A1A1A',
  saveActive: '#1A1A1A',

  // ─── Dark Mode ───────────────────────────────────────────
  dark: {
    background: '#0F0F0F',
    surface: '#1A1A1A',
    surfaceElevated: '#242424',
    border: '#2D2D2D',
    textPrimary: '#F5F3F0',
    textSecondary: '#A09A94',
  },
} as const;

export const Typography = {
  // Font families (loaded via expo-font)
  fontDisplay: 'CormorantGaramond',
  fontBody: 'Inter',

  // Scale
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 19,
  xl: 22,
  '2xl': 26,
  '3xl': 32,
  '4xl': 40,

  // Line heights
  lineHeightTight: 1.2,
  lineHeightBase: 1.5,
  lineHeightRelaxed: 1.7,

  // Letter spacing
  letterSpacingTight: -0.5,
  letterSpacingBase: 0,
  letterSpacingWide: 0.5,
  letterSpacingXWide: 1.2,
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
} as const;

export const Radii = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  '2xl': 20,
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
  sm: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  md: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#1A1A1A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 6,
  },
} as const;

export const Timing = {
  fast: 150,
  base: 250,
  slow: 400,
  verySlow: 600,
} as const;

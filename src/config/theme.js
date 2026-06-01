// src/config/theme.js
// Shared design tokens for dark gold SnapMath look.

export const BG = '#0B0D22';
export const SURFACE = '#1A1F3E';
export const SURFACE_BORDER = 'rgba(255,255,255,0.10)';
export const INPUT_BG = '#131933';

export const TEXT_PRIMARY = '#FFFFFF';
export const TEXT_SECONDARY = '#C7CEE2';
export const TEXT_TERTIARY = '#A2ABC3';

export const GOLD = '#C9A84C';
export const GOLD_LIGHT = '#E8D5A3';
export const GOLD_MUTED = '#9E8A58';
export const GOLD_DIM = 'rgba(201,168,76,0.35)';
export const GOLD_TINT = 'rgba(201,168,76,0.16)';
export const GOLD_BTN_TEXT = '#0A0D1F';

export const GOLD_BUTTON_GRADIENT = {
  colors: ['#E8D5A3', '#C9A84C'],
  start: { x: 0, y: 0.5 },
  end: { x: 1, y: 0.5 },
};

export const ECLIPSE_GLOW = {
  colors: ['rgba(201,168,76,0.28)', 'rgba(201,168,76,0.14)', 'rgba(11,13,34,0)'],
  locations: [0, 0.55, 1],
};

export const SCREEN_PADDING_H = 20;
export const CARD_BORDER_RADIUS = 18;
export const BUTTON_PILL_RADIUS = 26;

export const TYPE_SCALE = {
  h1: 28,
  h2: 22,
  h3: 18,
  body: 15,
  bodySmall: 13,
  caption: 12,
};

export const SPACING = {
  section: 20,
  card: 16,
  gap: 12,
};

export const SECTION_LABEL_STYLE = {
  color: TEXT_TERTIARY,
  fontSize: 11,
  letterSpacing: 1.6,
  marginBottom: 10,
};

export const FONTS = {
  headingEn: 'Amiri_700Bold',
  headlineEn: 'Amiri_700Bold',
  sectionLabel: 'Amiri_700Bold',
  semiEn: 'Amiri_700Bold',
  bodyEn: 'Amiri_400Regular',
  headingAr: 'Amiri_700Bold',
  bodyAr: 'Amiri_400Regular',
  tab: 'Amiri_700Bold',
};

// Used in legacy screens that render an Arabic heading style directly.
export const arabicHeading = {
  fontFamily: 'Amiri_700Bold',
  textAlign: 'right',
};

import {
  PREMIUM_GOLD,
  PREMIUM_GOLD_DEEP,
  PREMIUM_GOLD_GRADIENT,
  PREMIUM_GOLD_LIGHT,
} from './premiumGold';

export type ThemeId =
  | 'midnight'
  | 'espresso'
  | 'sunrise'
  | 'forest'
  | 'royal'
  | 'gold'
  | 'silver'
  | 'bronze'
  | 'pink'
  | 'light';

export type ThemeTier = 'free' | 'bronze' | 'silver' | 'gold';

export type AppTheme = {
  id: ThemeId;
  nameEn: string;
  nameAr: string;
  tier: ThemeTier;
  bg: string;
  surface: string;
  surfaceSoft: string;
  border: string;
  text: string;
  muted: string;
  primary: [string, string];
  accent: string;
  primaryInk: string;
  danger: string;
  logoGradient: [string, string];
  logoGlyph: string;
  logoShadow: string;
};

export const THEMES: Record<ThemeId, AppTheme> = {
  midnight: {
    id: 'midnight',
    nameEn: 'Midnight',
    nameAr: 'منتصف الليل',
    tier: 'free',
    bg: '#0B0D22',
    surface: '#1A1F3E',
    surfaceSoft: '#232844',
    border: 'rgba(255,255,255,0.10)',
    text: '#FFFFFF',
    muted: '#B8BED6',
    primary: PREMIUM_GOLD_GRADIENT,
    accent: PREMIUM_GOLD,
    primaryInk: '#1B1D30',
    danger: '#F04E59',
    logoGradient: [PREMIUM_GOLD_LIGHT, PREMIUM_GOLD],
    logoGlyph: '#FFFFFF',
    logoShadow: PREMIUM_GOLD_DEEP,
  },
  espresso: {
    id: 'espresso',
    nameEn: 'Espresso',
    nameAr: 'إسبريسو',
    tier: 'gold',
    bg: '#0E0907',
    surface: '#1A120E',
    surfaceSoft: '#241A14',
    border: 'rgba(214,168,110,0.18)',
    text: '#FFF4EC',
    muted: '#CDB39B',
    primary: ['#E2BF8D', '#A86E3A'],
    accent: '#D3A06A',
    primaryInk: '#22150B',
    danger: '#FF6860',
    logoGradient: ['#E7C18D', '#C2874B'],
    logoGlyph: '#22150B',
    logoShadow: '#A86E3A',
  },
  sunrise: {
    id: 'sunrise',
    nameEn: 'Sunrise',
    nameAr: 'الفجر',
    tier: 'free',
    bg: '#1A1020',
    surface: '#2A1D34',
    surfaceSoft: '#362845',
    border: 'rgba(255,220,190,0.20)',
    text: '#FFF7F1',
    muted: '#E7CFC3',
    primary: ['#FF8A3D', '#FF4E77'],
    accent: '#FF7A59',
    primaryInk: '#FFF8F2',
    danger: '#FF5A6A',
    logoGradient: ['#FF8A3D', '#FF4E77'],
    logoGlyph: '#FFF8F2',
    logoShadow: '#FF7447',
  },
  forest: {
    id: 'forest',
    nameEn: 'Forest',
    nameAr: 'الغابة',
    tier: 'free',
    bg: '#071A17',
    surface: '#112B25',
    surfaceSoft: '#183A32',
    border: 'rgba(188,255,223,0.16)',
    text: '#ECFFF5',
    muted: '#B7DEC9',
    primary: ['#20C997', '#2E9F73'],
    accent: '#4EDAA5',
    primaryInk: '#EDFFF7',
    danger: '#FF6B74',
    logoGradient: ['#20C997', '#2E9F73'],
    logoGlyph: '#EDFFF7',
    logoShadow: '#1FB687',
  },
  royal: {
    id: 'royal',
    nameEn: 'Royal',
    nameAr: 'الملكي',
    tier: 'free',
    bg: '#111225',
    surface: '#1E2146',
    surfaceSoft: '#292E5D',
    border: 'rgba(208,200,255,0.16)',
    text: '#F5F3FF',
    muted: '#C4BFEC',
    primary: ['#7C6BFF', '#4E8DFF'],
    accent: '#A699FF',
    primaryInk: '#F8F8FF',
    danger: '#FF6C8A',
    logoGradient: ['#7C6BFF', '#4E8DFF'],
    logoGlyph: '#F8F8FF',
    logoShadow: '#6F74FF',
  },
  bronze: {
    id: 'bronze',
    nameEn: 'Bronze',
    nameAr: 'برونزي',
    tier: 'bronze',
    bg: '#160E08',
    surface: '#2A1C10',
    surfaceSoft: '#382615',
    border: 'rgba(205,127,50,0.22)',
    text: '#FFF0E6',
    muted: '#D4A882',
    primary: ['#CD7F32', '#A0522D'],
    accent: '#CD7F32',
    primaryInk: '#FFF0E6',
    danger: '#FF5A4A',
    logoGradient: ['#E8A85A', '#CD7F32'],
    logoGlyph: '#FFF0E6',
    logoShadow: '#CD7F32',
  },
  silver: {
    id: 'silver',
    nameEn: 'Silver',
    nameAr: 'فضي',
    tier: 'silver',
    bg: '#0F1118',
    surface: '#1C1E2C',
    surfaceSoft: '#252838',
    border: 'rgba(192,192,210,0.20)',
    text: '#F0F0FF',
    muted: '#A8AABF',
    primary: ['#C0C0D8', '#8A8AAA'],
    accent: '#C0C0D8',
    primaryInk: '#1B1D30',
    danger: '#FF5A6A',
    logoGradient: ['#E0E0F0', '#A0A0C0'],
    logoGlyph: '#F0F0FF',
    logoShadow: '#A0A0D0',
  },
  gold: {
    id: 'gold',
    nameEn: 'Gold',
    nameAr: 'ذهبي',
    tier: 'gold',
    bg: '#100D04',
    surface: '#1E1A08',
    surfaceSoft: '#2A2410',
    border: 'rgba(184,149,42,0.22)',
    text: '#FFF8E7',
    muted: '#D7C27A',
    primary: PREMIUM_GOLD_GRADIENT,
    accent: PREMIUM_GOLD,
    primaryInk: '#1B1D30',
    danger: '#FF5A4A',
    logoGradient: [PREMIUM_GOLD_LIGHT, PREMIUM_GOLD],
    logoGlyph: '#1B1D30',
    logoShadow: PREMIUM_GOLD_DEEP,
  },
  pink: {
    id: 'pink',
    nameEn: 'Pink',
    nameAr: 'وردي',
    tier: 'gold',
    bg: '#160810',
    surface: '#2A1020',
    surfaceSoft: '#38162A',
    border: 'rgba(255,100,180,0.20)',
    text: '#FFF0F8',
    muted: '#E8A0CC',
    primary: ['#FF6EB4', '#D63384'],
    accent: '#FF6EB4',
    primaryInk: '#FFF0F8',
    danger: '#FF4060',
    logoGradient: ['#FF9EC8', '#D63384'],
    logoGlyph: '#FFF0F8',
    logoShadow: '#FF6EB4',
  },
  light: {
    id: 'light',
    nameEn: 'Daylight',
    nameAr: 'نهاري',
    tier: 'gold',
    bg: '#F6FAFF',
    surface: '#FFFFFF',
    surfaceSoft: '#EDF5FF',
    border: 'rgba(10,122,255,0.12)',
    text: '#16233B',
    muted: '#6B7C98',
    primary: ['#2590FF', '#0A7AFF'],
    accent: '#0A7AFF',
    primaryInk: '#FFFFFF',
    danger: '#FF3B30',
    logoGradient: ['#3EA3FF', '#0A7AFF'],
    logoGlyph: '#FFFFFF',
    logoShadow: '#2E8BFF',
  },
};

export const DEFAULT_THEME_ID: ThemeId = 'midnight';

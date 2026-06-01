import type { AppTheme } from './themes';
import { withAlpha } from './colorUtils';

export type ThemeSemantics = {
  panel: string;
  panelRaised: string;
  accentSoft: string;
  accentStrong: string;
  accentBorder: string;
  glass: string;
  glassStrong: string;
  inverseSoft: string;
  scrim: string;
  success: string;
  successSoft: string;
  dangerSoft: string;
  switchTrackOff: string;
  switchThumb: string;
};

export function getThemeSemantics(theme: AppTheme): ThemeSemantics {
  const isLight = theme.id === 'light';

  return {
    panel: theme.surface,
    panelRaised: isLight ? withAlpha(theme.surfaceSoft, 0.96) : withAlpha(theme.surfaceSoft, 0.92),
    accentSoft: withAlpha(theme.accent, isLight ? 0.1 : 0.12),
    accentStrong: withAlpha(theme.accent, isLight ? 0.16 : 0.18),
    accentBorder: withAlpha(theme.accent, isLight ? 0.24 : 0.3),
    glass: isLight ? withAlpha(theme.primaryInk, 0.1) : withAlpha(theme.primaryInk, 0.14),
    glassStrong: isLight ? withAlpha(theme.primaryInk, 0.14) : withAlpha(theme.primaryInk, 0.18),
    inverseSoft: isLight ? withAlpha(theme.surface, 0.96) : withAlpha(theme.primaryInk, 0.18),
    scrim: isLight ? withAlpha('#0F172A', 0.22) : withAlpha('#050816', 0.56),
    success: isLight ? '#1A9C5A' : '#2ED573',
    successSoft: isLight ? 'rgba(26,156,90,0.12)' : 'rgba(46,213,115,0.15)',
    dangerSoft: isLight ? 'rgba(255,59,48,0.1)' : 'rgba(255,59,48,0.12)',
    switchTrackOff: isLight ? withAlpha(theme.text, 0.14) : withAlpha(theme.text, 0.18),
    switchThumb: isLight ? '#FFFFFF' : '#EDEDED',
  };
}

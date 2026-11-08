/**
 * Design tokens. Components in src/shared/ui read from here so a colour or
 * spacing change happens in one place.
 *
 * Palette: the Pasuyo Parang green and white (home design, 2026-11-03).
 * The saturated green carries headers and buttons; the pale tone is used
 * for tints, icon circles, chips and surfaces.
 */
export const colors = {
  primary: '#2E9B4F',
  primaryPressed: '#1F7A3A',
  /** Pale green: selected rows, active nav, icon circles, status pills. */
  primarySoft: '#D7F0DD',
  /** Dark green for headings on white, as in the home design. */
  primaryDeep: '#14532D',
  onPrimary: '#FFFFFF',
  background: '#FFFFFF',
  /** Green-tinted off-white for page canvases and grouped content. */
  surface: '#EEF7F0',
  text: '#14341F',
  textMuted: '#5A6F60',
  border: '#CFE5D5',
  danger: '#C2410C',
  dangerSoft: '#FDE8DF',
  success: '#1F7A3A',
  successSoft: '#D7F0DD',
  warningSoft: '#FFF3D6',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 8,
  /** Buttons, inputs and chips. */
  control: 12,
  md: 14,
  /** Cards and sheets. */
  card: 16,
  lg: 20,
  pill: 999,
} as const;

export const fontSize = {
  sm: 13,
  md: 16,
  lg: 20,
  xl: 28,
  display: 34,
} as const;

export const shadow = {
  card: {
    shadowColor: '#15271F',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
} as const;

export type Color = keyof typeof colors;

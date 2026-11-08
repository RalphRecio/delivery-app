/**
 * Design tokens for the desktop admin console only. They follow the Suhay ERP
 * (PRPO) console: slate greys, blue for the selected navigation row, indigo
 * for primary actions, and soft rectangular status pills. The customer and
 * rider apps keep the green `theme.ts` palette.
 */
export const adminColors = {
  canvas: '#F3F4F6',
  surface: '#FFFFFF',
  surfaceMuted: '#F8FAFC',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  text: '#0F172A',
  textSecondary: '#475569',
  textMuted: '#64748B',
  textFaint: '#94A3B8',
  brand: '#4655AC',
  brandHover: '#3B4896',
  brandSoft: '#EEF0F8',
  navActiveBackground: '#EFF6FF',
  navActiveText: '#1D4ED8',
  navActiveIcon: '#2563EB',
  danger: '#DC2626',
  dangerHover: '#B91C1C',
} as const;

export const adminRadius = {
  button: 4,
  control: 6,
  pill: 6,
  panel: 12,
} as const;

export const adminFontSize = {
  xs: 11,
  sm: 12,
  md: 13,
  base: 14,
  lg: 16,
  xl: 20,
  stat: 30,
} as const;

/** Soft pill colours, Tailwind's 100/200/800 steps of each hue. */
export type PillTone =
  'gray' | 'amber' | 'orange' | 'green' | 'red' | 'indigo' | 'purple' | 'sky' | 'blue';

export const pillColors: Record<PillTone, { background: string; border: string; text: string }> = {
  gray: { background: '#F1F5F9', border: '#E2E8F0', text: '#334155' },
  amber: { background: '#FEF3C7', border: '#FDE68A', text: '#92400E' },
  orange: { background: '#FFEDD5', border: '#FED7AA', text: '#9A3412' },
  green: { background: '#DCFCE7', border: '#BBF7D0', text: '#166534' },
  red: { background: '#FEE2E2', border: '#FECACA', text: '#991B1B' },
  indigo: { background: '#E0E7FF', border: '#C7D2FE', text: '#3730A3' },
  purple: { background: '#F3E8FF', border: '#E9D5FF', text: '#6B21A8' },
  sky: { background: '#E0F2FE', border: '#BAE6FD', text: '#075985' },
  blue: { background: '#DBEAFE', border: '#BFDBFE', text: '#1E40AF' },
};

export const adminShadow = {
  panel: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
} as const;

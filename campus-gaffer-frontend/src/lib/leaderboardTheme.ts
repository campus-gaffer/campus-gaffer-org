import { THEME } from './theme';

export const AV_COLORS = [
  'oklch(0.70 0.16 25)', 'oklch(0.60 0.14 260)', 'oklch(0.78 0.15 80)',
  'oklch(0.70 0.15 340)', 'oklch(0.70 0.12 195)', 'oklch(0.72 0.16 50)',
  'oklch(0.70 0.15 305)', 'oklch(0.72 0.14 150)',
];

export const MEDAL_COLORS = {
  gold:   { color: THEME.gold,   lighter: 'oklch(0.93 0.14 85)'  },
  silver: { color: 'oklch(0.82 0.04 240)', lighter: 'oklch(0.90 0.04 240)' },
  bronze: { color: 'oklch(0.75 0.14 55)',  lighter: 'oklch(0.83 0.11 55)'  },
};

export const GAMEWEEK = 7;
export const PAGE_SIZE = 20;

export type LBUser = {
  id: string;
  rank: number;
  name: string;
  isMe: boolean;
  seasonPts: number;
  gwPts: number;
  avColor: string;
  initial: string;
};

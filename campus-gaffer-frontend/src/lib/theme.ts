export const THEME = {
  bg: 'oklch(0.13 0.025 248)',
  bg2: 'oklch(0.10 0.02 248)',
  card: 'oklch(0.17 0.03 248)',
  cardHi: 'oklch(0.20 0.04 248)',
  hero: 'oklch(0.19 0.05 152)',
  heroBorder: 'oklch(0.34 0.12 148)',
  line: 'oklch(0.28 0.04 248)',
  lineDim: 'oklch(0.22 0.03 248)',
  accent: 'oklch(0.82 0.19 142)',
  accentDim: 'oklch(0.55 0.12 142)',
  accentInk: 'oklch(0.18 0.04 142)',
  warn: 'oklch(0.78 0.16 60)',
  warnDim: 'oklch(0.28 0.06 60)',
  text: '#fff',
  textDim: 'rgba(235,235,245,0.65)',
  textFaint: 'rgba(235,235,245,0.42)',
  gold: 'oklch(0.85 0.18 85)',
  tabBg: 'oklch(0.12 0.022 248)',
} as const;

export const withAlpha = (color: string, alpha: number) => color.replace(')', ` / ${alpha})`);
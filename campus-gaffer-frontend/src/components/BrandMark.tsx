import { THEME } from '../lib/theme';

export function BrandMark({ size = 22 }: { size?: number }) {
  const a = THEME.accent;

  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="14" cy="14" r="13" fill="none" stroke={a} strokeWidth="2" />
      <polygon points="14,7 19.5,11 17.4,17.5 10.6,17.5 8.5,11" fill={a} stroke={a} strokeWidth="1" />
      <line x1="14" y1="7" x2="14" y2="2" stroke={a} strokeWidth="1.4" />
      <line x1="19.5" y1="11" x2="24" y2="8.5" stroke={a} strokeWidth="1.4" />
      <line x1="17.4" y1="17.5" x2="20.5" y2="22.5" stroke={a} strokeWidth="1.4" />
      <line x1="10.6" y1="17.5" x2="7.5" y2="22.5" stroke={a} strokeWidth="1.4" />
      <line x1="8.5" y1="11" x2="4" y2="8.5" stroke={a} strokeWidth="1.4" />
    </svg>
  );
}
import { useMemo } from 'react';

// ─── Palette ───────────────────────────────────────────────────────────────
const PAL = {
  bg: 'oklch(0.13 0.025 248)', bg2: 'oklch(0.10 0.02 248)',
  card: 'oklch(0.17 0.03 248)', cardDark: 'oklch(0.13 0.025 248)',
  cardGlass: 'rgba(12, 17, 30, 0.86)',
  line: 'oklch(0.28 0.04 248)', lineDim: 'oklch(0.22 0.03 248)',
  accent: 'oklch(0.82 0.19 142)', accentInk: 'oklch(0.18 0.04 142)',
  pitch1: 'oklch(0.55 0.13 145)', pitch2: 'oklch(0.48 0.13 145)',
  pitchLine: 'rgba(255,255,255,0.34)',
  text: '#fff', textDim: 'rgba(235,235,245,0.65)', textFaint: 'rgba(235,235,245,0.45)',
  starGlow: 'oklch(0.85 0.18 95)',
};

const TEAM_COLORS: Record<string, string> = {
  KCS: 'oklch(0.70 0.16 25)', TRN: 'oklch(0.60 0.14 260)', WAD: 'oklch(0.78 0.15 80)',
  STJ: 'oklch(0.70 0.15 340)', PMB: 'oklch(0.70 0.12 195)', MED: 'oklch(0.72 0.16 50)',
  ENG: 'oklch(0.70 0.15 305)', LAW: 'oklch(0.62 0.16 10)', HIL: 'oklch(0.72 0.14 150)',
  NTH: 'oklch(0.72 0.14 220)',
};

interface Player {
  id: number; surname: string; squadNum: number; team: string;
  price: number; pts: number; mvp?: boolean;
}

const SQUAD = {
  starters: [
    { id: 1, surname: 'Doyle',   squadNum: 9,  team: 'KCS', price: 9.5, pts: 11, mvp: true  },
    { id: 2, surname: 'Mbeki',   squadNum: 10, team: 'WAD', price: 8.0, pts: 7,  mvp: false },
    { id: 3, surname: 'Diaz',    squadNum: 8,  team: 'TRN', price: 7.0, pts: 6,  mvp: false },
    { id: 4, surname: 'Cohen',   squadNum: 7,  team: 'KCS', price: 6.5, pts: 4,  mvp: false },
    { id: 5, surname: 'Bennett', squadNum: 4,  team: 'KCS', price: 5.5, pts: 5,  mvp: false },
    { id: 6, surname: 'Hartley', squadNum: 1,  team: 'KCS', price: 5.0, pts: 4,  mvp: false },
  ] as Player[],
  bench: [
    { id: 7,  surname: 'Khan',     squadNum: 11, team: 'STJ', price: 6.0, pts: 3  },
    { id: 8,  surname: 'Schmidt',  squadNum: 12, team: 'STJ', price: 6.5, pts: 0  },
    { id: 9,  surname: 'Hall',     squadNum: 13, team: 'HIL', price: 4.5, pts: 2  },
    { id: 10, surname: 'Andersen', squadNum: 14, team: 'PMB', price: 4.5, pts: 0  },
  ] as Player[],
};

const FORMATION = [2, 2, 2]; // 2-2-2
const GAMEWEEK = 7;
const SEASON_TOTAL = 142;
const GW_POINTS_STARTERS = 37;
const SEASON_AVG = (SEASON_TOTAL / GAMEWEEK).toFixed(1);
const RANK = 1847;

function partitionByFormation(flat: Player[], pattern: number[]) {
  const rows: Player[][] = [];
  let i = 0;
  for (const n of pattern) { rows.push(flat.slice(i, i + n)); i += n; }
  return rows;
}

// ─── Jersey SVG ────────────────────────────────────────────────────────────
function Jersey({ color, num, size = 54, dim = false }: { color: string; num: number; size?: number; dim?: boolean }) {
  const gid = `jersey-${color.replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <svg width={size} height={size} viewBox="0 0 60 60" aria-hidden="true" style={{ opacity: dim ? 0.55 : 1, display: 'block' }}>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="1.12" />
          <stop offset="100%" stopColor={color} />
        </linearGradient>
      </defs>
      <path d="M 6 14 L 16 4 L 22 4 C 23.5 7.5 36.5 7.5 38 4 L 44 4 L 54 14 L 50 25 L 44 21 L 44 56 L 16 56 L 16 21 L 10 25 Z" fill={`url(#${gid})`} />
      <path d="M 16 4 L 22 4 C 23.5 7.5 36.5 7.5 38 4 L 44 4 L 47 7 L 39 9 C 35 12 25 12 21 9 L 13 7 Z" fill="rgba(0,0,0,0.22)" />
      <text x="30" y="38" textAnchor="middle" fill="rgba(0,0,0,0.55)" fontFamily="'Bricolage Grotesque', sans-serif" fontWeight="800" fontSize="18" style={{ letterSpacing: '-0.04em' }}>{num}</text>
    </svg>
  );
}

// ─── Pitch background ──────────────────────────────────────────────────────
function PitchBackground() {
  const { pitch1, pitch2, pitchLine } = PAL;
  return (
    <svg width="100%" height="100%" viewBox="0 0 358 420" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
      <defs>
        <linearGradient id="pitchGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={pitch1} />
          <stop offset="100%" stopColor={pitch2} />
        </linearGradient>
        <pattern id="pitchStripes" x="0" y="0" width="358" height="56" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="358" height="28" fill="rgba(255,255,255,0.04)" />
        </pattern>
        <radialGradient id="pitchVignette" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stopColor="rgba(0,0,0,0)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0.42)" />
        </radialGradient>
      </defs>
      <rect width="358" height="420" fill="url(#pitchGrad)" />
      <rect width="358" height="420" fill="url(#pitchStripes)" />
      <rect width="358" height="420" fill="url(#pitchVignette)" />
      <rect x="8" y="8" width="342" height="404" fill="none" stroke={pitchLine} strokeWidth="1.2" />
      <line x1="8" y1="210" x2="350" y2="210" stroke={pitchLine} strokeWidth="1.2" />
      <circle cx="179" cy="210" r="44" fill="none" stroke={pitchLine} strokeWidth="1.2" />
      <circle cx="179" cy="210" r="2.5" fill={pitchLine} />
      <rect x="79" y="8" width="200" height="58" fill="none" stroke={pitchLine} strokeWidth="1.2" />
      <rect x="129" y="8" width="100" height="22" fill="none" stroke={pitchLine} strokeWidth="1.2" />
      <path d="M 144 66 A 36 36 0 0 0 214 66" fill="none" stroke={pitchLine} strokeWidth="1.2" />
      <circle cx="179" cy="44" r="2" fill={pitchLine} />
      <rect x="79" y="354" width="200" height="58" fill="none" stroke={pitchLine} strokeWidth="1.2" />
      <rect x="129" y="390" width="100" height="22" fill="none" stroke={pitchLine} strokeWidth="1.2" />
      <path d="M 144 354 A 36 36 0 0 1 214 354" fill="none" stroke={pitchLine} strokeWidth="1.2" />
      <circle cx="179" cy="376" r="2" fill={pitchLine} />
      <path d="M 8 18 A 10 10 0 0 0 18 8" fill="none" stroke={pitchLine} strokeWidth="1.2" />
      <path d="M 340 8 A 10 10 0 0 0 350 18" fill="none" stroke={pitchLine} strokeWidth="1.2" />
      <path d="M 350 402 A 10 10 0 0 0 340 412" fill="none" stroke={pitchLine} strokeWidth="1.2" />
      <path d="M 18 412 A 10 10 0 0 0 8 402" fill="none" stroke={pitchLine} strokeWidth="1.2" />
    </svg>
  );
}

// ─── Starter tile ──────────────────────────────────────────────────────────
function StarterTile({ p }: { p: Player }) {
  const teamColor = TEAM_COLORS[p.team] || PAL.accent;
  return (
    <div style={{ width: 104, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      {p.mvp && (
        <div style={{ position: 'absolute', top: -4, right: 10, zIndex: 4, width: 22, height: 22, borderRadius: '50%', background: PAL.starGlow, color: '#1a1503', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 11, boxShadow: `0 4px 14px -4px ${PAL.starGlow}`, border: '2px solid rgba(10,15,28,0.95)' }} aria-label="Match MVP">★</div>
      )}
      <div style={{ marginBottom: -22, zIndex: 2, position: 'relative' }}>
        <Jersey color={teamColor} num={p.squadNum} size={54} />
      </div>
      <div style={{ width: 100, background: PAL.cardGlass, backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: `1px solid rgba(255,255,255,${p.mvp ? 0.18 : 0.09})`, borderRadius: 12, paddingTop: 26, paddingBottom: 0, textAlign: 'center', position: 'relative', boxShadow: '0 8px 18px -10px rgba(0,0,0,0.75)', overflow: 'hidden' }}>
        <div style={{ padding: '0 6px 8px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 13, color: PAL.text, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%', lineHeight: 1.1 }}>{p.surname}</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.06em', color: PAL.textFaint, fontVariantNumeric: 'tabular-nums' }}>£{p.price.toFixed(1)}</div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '6px 8px', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 5 }}>
          <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 18, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em', color: p.pts >= 10 ? PAL.accent : PAL.text }}>{p.pts}</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8.5, letterSpacing: '0.14em', color: PAL.textFaint, textTransform: 'uppercase' }}>pts</span>
        </div>
      </div>
    </div>
  );
}

// ─── Bench tile ────────────────────────────────────────────────────────────
function BenchTile({ p }: { p: Player }) {
  const teamColor = TEAM_COLORS[p.team] || PAL.accent;
  const didntPlay = p.pts === 0;
  return (
    <div style={{ flex: 1, minWidth: 0, background: PAL.cardDark, border: `1px solid ${PAL.lineDim}`, borderRadius: 10, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 22, paddingBottom: 0 }}>
      <div style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)' }}>
        <Jersey color={teamColor} num={p.squadNum} size={40} dim={didntPlay} />
      </div>
      <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 12, color: didntPlay ? PAL.textFaint : PAL.text, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '90%', textAlign: 'center' }}>{p.surname}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: '0.06em', color: PAL.textFaint, fontVariantNumeric: 'tabular-nums', marginTop: 1, marginBottom: 6 }}>£{p.price.toFixed(1)}</div>
      <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '5px 0', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
        <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 15, lineHeight: 1, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.03em', color: didntPlay ? PAL.textFaint : PAL.text }}>{p.pts}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: '0.14em', color: PAL.textFaint, textTransform: 'uppercase' }}>pts</span>
      </div>
    </div>
  );
}

// ─── Score card ────────────────────────────────────────────────────────────
function ScoreCard() {
  return (
    <div style={{ margin: '4px 16px 14px', background: PAL.card, border: `1px solid ${PAL.lineDim}`, borderRadius: 18, padding: '14px 18px 16px', position: 'relative', overflow: 'hidden', boxShadow: '0 8px 28px -16px rgba(0,0,0,0.6)' }}>
      <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: `radial-gradient(circle, oklch(0.82 0.19 142 / 0.18), transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ padding: '4px 10px', borderRadius: 6, background: `oklch(from ${PAL.accent} l c h / 0.18)`, color: PAL.accent, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700 }}>Gameweek {GAMEWEEK}</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.18em', color: PAL.textDim, textTransform: 'uppercase', fontWeight: 600 }}>
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <rect x="2" y="4.5" width="6" height="4.5" rx="0.6" stroke="currentColor" strokeWidth="1" />
            <path d="M3.2 4.5V3a1.8 1.8 0 0 1 3.6 0v1.5" stroke="currentColor" strokeWidth="1" fill="none" />
          </svg>
          Squad Locked
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 60, lineHeight: 0.9, letterSpacing: '-0.05em', fontVariantNumeric: 'tabular-nums', color: PAL.text }}>{SEASON_TOTAL}</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 12, letterSpacing: '0.16em', color: PAL.textDim, textTransform: 'uppercase', marginBottom: 4 }}>pts</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, paddingBottom: 6 }}>
          <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 22, letterSpacing: '-0.02em', color: PAL.accent, fontVariantNumeric: 'tabular-nums' }}>+{GW_POINTS_STARTERS}</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.14em', color: PAL.accent, textTransform: 'uppercase', fontWeight: 600 }}>GW{GAMEWEEK}</span>
        </div>
      </div>
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${PAL.lineDim}`, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr' }}>
        {[
          { label: 'Squad Value', value: '£63.0' },
          { label: 'Avg / GW', value: SEASON_AVG },
          { label: 'Rank', value: `#${RANK.toLocaleString()}` },
        ].map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: '0.18em', color: PAL.textFaint, textTransform: 'uppercase', fontWeight: 500 }}>{label}</span>
            <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: '-0.02em', color: PAL.text, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────
export default function SquadScreen({ onBack }: { onBack: () => void }) {
  const rows = useMemo(() => partitionByFormation(SQUAD.starters, FORMATION), []);
  const benchPoints = SQUAD.bench.reduce((s, p) => s + p.pts, 0);
  const pitchHeight = 400;

  return (
    <div style={{ position: 'relative', width: 390, height: 844, background: PAL.bg2, color: PAL.text, fontFamily: "'DM Sans', sans-serif", overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 50, flexShrink: 0 }} />

      {/* Header */}
      <div style={{ padding: '6px 18px 4px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, background: PAL.bg2, zIndex: 4 }}>
        <button type="button" aria-label="Back" onClick={onBack} style={{ width: 34, height: 34, borderRadius: '50%', border: `1px solid ${PAL.line}`, background: 'rgba(255,255,255,0.03)', color: PAL.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ flex: 1, textAlign: 'center', fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: '-0.01em' }}>My Squad</div>
        <button type="button" aria-label="More" style={{ width: 34, height: 34, borderRadius: '50%', border: `1px solid ${PAL.line}`, background: 'rgba(255,255,255,0.03)', color: PAL.textDim, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="3" cy="7" r="1.2" fill="currentColor" />
            <circle cx="7" cy="7" r="1.2" fill="currentColor" />
            <circle cx="11" cy="7" r="1.2" fill="currentColor" />
          </svg>
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 40 }}>
        <ScoreCard />

        {/* Pitch */}
        <div style={{ margin: '0 16px', position: 'relative', borderRadius: 18, overflow: 'hidden', border: `1px solid rgba(255,255,255,0.06)`, height: pitchHeight, flexShrink: 0, boxShadow: '0 12px 28px -16px rgba(0,0,0,0.5)' }}>
          <PitchBackground />
          <div style={{ position: 'absolute', top: 10, left: 12, zIndex: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.20em', color: 'rgba(255,255,255,0.78)', textTransform: 'uppercase', fontWeight: 700, background: 'rgba(0,0,0,0.32)', padding: '3px 8px', borderRadius: 4, backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}>
            2-2-2
          </div>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', padding: '24px 8px 14px', zIndex: 3 }}>
            {rows.map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-around' }}>
                {row.map(p => <StarterTile key={p.id} p={p} />)}
              </div>
            ))}
          </div>
        </div>

        {/* Bench */}
        <div style={{ margin: '14px 16px 0', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10, paddingLeft: 2, paddingRight: 2 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.22em', color: PAL.text, textTransform: 'uppercase', fontWeight: 700 }}>Bench</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.14em', color: PAL.textFaint, textTransform: 'uppercase' }}>
              4 Players · 0 Subs (Locked) · {benchPoints} pts
            </span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${PAL.lineDim}`, borderRadius: 14, padding: '24px 10px 10px', display: 'flex', gap: 8 }}>
            {SQUAD.bench.map(p => <BenchTile key={p.id} p={p} />)}
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: 20, padding: '0 22px 4px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', gap: 14, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.12em', color: PAL.textFaint, textTransform: 'uppercase', lineHeight: 1.4 }}>
            <div>Next deadline<br /><span style={{ color: PAL.textDim }}>GW8 · Sat 12:00</span></div>
            <div style={{ textAlign: 'right' }}>Season locked<br /><span style={{ color: PAL.textDim }}>no transfers</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

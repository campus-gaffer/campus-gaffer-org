import { useState, useEffect, useRef, useCallback } from 'react';

// ─── Palette ───────────────────────────────────────────────────────────────
const PAL = {
  bg: 'oklch(0.13 0.025 248)', bg2: 'oklch(0.10 0.02 248)',
  card: 'oklch(0.17 0.03 248)', cardAlt: 'oklch(0.20 0.035 248)',
  line: 'oklch(0.28 0.04 248)', lineDim: 'oklch(0.22 0.03 248)',
  accent: 'oklch(0.82 0.19 142)', accentDim: 'oklch(0.55 0.12 142)',
  accentInk: 'oklch(0.18 0.04 142)',
  warn: 'oklch(0.78 0.16 60)', danger: 'oklch(0.70 0.20 25)',
  text: '#fff', textDim: 'rgba(235,235,245,0.65)', textFaint: 'rgba(235,235,245,0.42)',
  benchText: 'rgba(235,235,245,0.38)', benchCard: 'oklch(0.155 0.025 248)',
  starGlow: 'oklch(0.85 0.18 95)',
};

const TEAM_COLORS: Record<string, string> = {
  KCS: 'oklch(0.70 0.16 25)', TRN: 'oklch(0.60 0.14 260)', WAD: 'oklch(0.78 0.15 80)',
  STJ: 'oklch(0.70 0.15 340)', PMB: 'oklch(0.70 0.12 195)', MED: 'oklch(0.72 0.16 50)',
  ENG: 'oklch(0.70 0.15 305)', LAW: 'oklch(0.62 0.16 10)', HIL: 'oklch(0.72 0.14 150)',
  NTH: 'oklch(0.72 0.14 220)',
};

const withAlpha = (color: string, alpha: number) => color.replace(')', ` / ${alpha})`);

const APPEARANCE = 2, GOAL_PTS = 4, WIN_PTS = 2, DRAW_PTS = 1, MVP_PTS = 3;

interface PlayerData {
  id: number; name: string; team: string; played: boolean;
  goals: number; result: string; mvp: boolean;
}

function calcPts(p: PlayerData) {
  if (!p.played) return 0;
  return APPEARANCE + p.goals * GOAL_PTS
    + (p.result === 'W' ? WIN_PTS : p.result === 'D' ? DRAW_PTS : 0)
    + (p.mvp ? MVP_PTS : 0);
}

const GW_DATA = {
  gameweek: 7, seasonTotal: 142,
  starters: [
    { id: 1, name: 'Doyle',   team: 'KCS', played: true,  goals: 1, result: 'W', mvp: true  },
    { id: 2, name: 'Mbeki',   team: 'WAD', played: true,  goals: 1, result: 'D', mvp: false },
    { id: 3, name: 'Cohen',   team: 'KCS', played: true,  goals: 1, result: 'W', mvp: false },
    { id: 4, name: 'Diaz',    team: 'TRN', played: true,  goals: 0, result: 'W', mvp: false },
    { id: 5, name: 'Bennett', team: 'KCS', played: true,  goals: 0, result: 'W', mvp: false },
    { id: 6, name: 'Hartley', team: 'KCS', played: true,  goals: 0, result: 'D', mvp: false },
  ] as PlayerData[],
  bench: [
    { id: 7,  name: 'Khan',     team: 'STJ', played: true,  goals: 1, result: 'W', mvp: false },
    { id: 8,  name: 'Schmidt',  team: 'STJ', played: true,  goals: 0, result: 'L', mvp: false },
    { id: 9,  name: 'Hall',     team: 'HIL', played: true,  goals: 0, result: 'W', mvp: false },
    { id: 10, name: 'Andersen', team: 'PMB', played: false, goals: 0, result: 'L', mvp: false },
  ] as PlayerData[],
};

// ─── Count-up hook ─────────────────────────────────────────────────────────
function useCountUp(target: number, duration = 900, delay = 200) {
  const [val, setVal] = useState(0);
  const raf = useRef<number | null>(null);
  useEffect(() => {
    let start: number | null = null;
    const timeout = setTimeout(() => {
      const step = (ts: number) => {
        if (!start) start = ts;
        const progress = Math.min((ts - start) / duration, 1);
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        setVal(Math.round(eased * target));
        if (progress < 1) raf.current = requestAnimationFrame(step);
      };
      raf.current = requestAnimationFrame(step);
    }, delay);
    return () => { clearTimeout(timeout); if (raf.current) cancelAnimationFrame(raf.current); };
  }, [target, duration, delay]);
  return val;
}

// ─── Components ────────────────────────────────────────────────────────────
function BallMark({ size = 18 }: { size?: number }) {
  const a = PAL.accent;
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

function ResultBadge({ result, bench }: { result: string; bench: boolean }) {
  if (!result) return <span style={{ color: PAL.textFaint }}>—</span>;
  const color = bench ? PAL.benchText : result === 'W' ? PAL.accent : result === 'D' ? PAL.warn : PAL.textFaint;
  const bg = bench ? 'transparent' : result === 'W' ? withAlpha(PAL.accent, 0.12) : result === 'D' ? withAlpha(PAL.warn, 0.12) : 'transparent';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24, borderRadius: 6, background: bg, color, fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 12, letterSpacing: '0.02em' }}>{result}</span>
  );
}

function CheckCross({ yes, bench, isGold }: { yes: boolean; bench: boolean; isGold?: boolean }) {
  if (bench) return <span style={{ color: PAL.benchText, fontFamily: "'JetBrains Mono',monospace", fontSize: 12 }}>{yes ? '✓' : '·'}</span>;
  if (yes) return (
    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20, borderRadius: '50%', background: isGold ? withAlpha(PAL.starGlow, 0.16) : withAlpha(PAL.accent, 0.16), color: isGold ? PAL.starGlow : PAL.accent }} aria-label="Yes">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path d="M2 5l2.5 2.5L8 2.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
  return <span style={{ color: PAL.textFaint, fontFamily: "'JetBrains Mono',monospace", fontSize: 13, lineHeight: 1 }}>·</span>;
}

function ScoreDrawer({ player, bench, visible }: { player: PlayerData; bench: boolean; visible: boolean }) {
  const pts = calcPts(player);
  const items: { label: string; val: number | null; note: string; star?: boolean }[] = [];
  if (!player.played) {
    items.push({ label: 'Did not play', val: 0, note: '' });
  } else {
    items.push({ label: 'Appearance', val: APPEARANCE, note: '' });
    if (player.goals > 0) items.push({ label: `Goal${player.goals > 1 ? 's' : ''}`, val: player.goals * GOAL_PTS, note: `${player.goals} × ${GOAL_PTS}` });
    if (player.result === 'W') items.push({ label: 'Win bonus', val: WIN_PTS, note: '' });
    if (player.result === 'D') items.push({ label: 'Draw bonus', val: DRAW_PTS, note: '' });
    if (player.mvp) items.push({ label: 'Match MVP', val: MVP_PTS, note: '', star: true });
    if (bench) items.push({ label: 'On bench (not counted)', val: null, note: '' });
  }
  const textCol = bench ? PAL.benchText : PAL.textDim;
  // suppress unused pts warning - it's used by the parent caller context
  void pts;
  return (
    <div style={{ overflow: 'hidden', maxHeight: visible ? `${items.length * 34 + 20}px` : 0, transition: 'max-height 260ms cubic-bezier(.4,0,.2,1)', willChange: 'max-height' }}>
      <div style={{ padding: '6px 16px 10px', display: 'flex', flexDirection: 'column', gap: 0, borderTop: `1px dashed ${PAL.lineDim}` }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: 32 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.08em', color: item.star ? PAL.starGlow : textCol, display: 'flex', alignItems: 'center', gap: 6 }}>
              {item.star && <span style={{ fontSize: 12 }}>★</span>}
              {item.label}
              {item.note && <span style={{ color: PAL.textFaint, fontSize: 10 }}> ({item.note})</span>}
            </span>
            <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 14, color: item.val === null ? PAL.textFaint : item.star ? PAL.starGlow : bench ? PAL.benchText : PAL.text, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>
              {item.val === null ? '—' : `+${item.val}`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlayerRow({ player, bench, expanded, onToggle }: { player: PlayerData; bench: boolean; expanded: boolean; onToggle: (id: number) => void }) {
  const pts = calcPts(player);
  const teamColor = TEAM_COLORS[player.team] || PAL.accent;
  const dim = bench;
  const isMvp = player.mvp && !bench;
  return (
    <div style={{ background: expanded ? (bench ? PAL.benchCard : PAL.cardAlt) : 'transparent', borderRadius: 14, marginBottom: 2, transition: 'background 180ms', cursor: 'pointer', overflow: 'hidden', border: `1px solid ${expanded ? PAL.line : 'transparent'}` }} onClick={() => onToggle(player.id)}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 44px 44px 44px 44px', alignItems: 'center', padding: '0 6px', height: 52, gap: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, paddingLeft: 6 }}>
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: withAlpha(teamColor, dim ? 0.10 : 0.18), color: dim ? PAL.benchText : teamColor, border: `1.5px solid ${withAlpha(teamColor, dim ? 0.25 : 0.45)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 12, flexShrink: 0 }}>
            {player.name.charAt(0)}
          </div>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 14.5, color: dim ? PAL.benchText : PAL.text, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{player.name}</span>
              {isMvp && <span style={{ fontSize: 11, color: PAL.starGlow, lineHeight: 1 }} title="Match MVP">★</span>}
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: '0.10em', color: dim ? PAL.benchText : PAL.textFaint, textTransform: 'uppercase', marginTop: 1 }}>{player.team}</div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          {player.goals > 0 ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 8, background: dim ? 'transparent' : withAlpha(PAL.accent, 0.14), color: dim ? PAL.benchText : PAL.accent, fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 14, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums' }}>{player.goals}</span>
          ) : (
            <span style={{ color: PAL.textFaint, fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}>·</span>
          )}
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <ResultBadge result={player.result} bench={dim} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <CheckCross yes={player.mvp} bench={dim} isGold />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', paddingRight: 8 }}>
          <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em', fontVariantNumeric: 'tabular-nums', color: dim ? PAL.benchText : pts >= 11 ? PAL.accent : PAL.text, textShadow: pts >= 11 && !dim ? `0 0 10px oklch(0.82 0.19 142 / 0.35)` : 'none' }}>{pts}</span>
        </div>
      </div>
      <ScoreDrawer player={player} bench={dim} visible={expanded} />
    </div>
  );
}

function ColHeaders() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 44px 44px 44px 44px', alignItems: 'center', padding: '0 6px', height: 32, gap: 0, borderBottom: `1px solid ${PAL.lineDim}`, position: 'sticky', top: 0, background: PAL.bg, zIndex: 3 }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: '0.20em', color: PAL.textFaint, textTransform: 'uppercase', paddingLeft: 12 }}>Player</span>
      {[{ label: 'GLS', title: 'Goals' }, { label: 'WIN', title: 'Win bonus' }, { label: 'MVP', title: 'MVP award' }, { label: 'PTS', title: 'Points' }].map(({ label, title }) => (
        <div key={label} style={{ display: 'flex', justifyContent: label === 'PTS' ? 'flex-end' : 'center', paddingRight: label === 'PTS' ? 8 : 0 }} title={title}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: '0.16em', color: PAL.textFaint, textTransform: 'uppercase' }}>{label}</span>
        </div>
      ))}
    </div>
  );
}

function MiniStat({ label, value, suffix, faint }: { label: string; value: string | number; suffix?: string; faint?: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: '0.16em', color: PAL.textFaint, textTransform: 'uppercase', fontWeight: 500 }}>{label}</span>
      <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em', color: faint ? PAL.textFaint : PAL.text, fontVariantNumeric: 'tabular-nums', textDecoration: faint ? 'line-through' : 'none' }}>
        {value}{suffix ? <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 9, marginLeft: 2, letterSpacing: '0.10em', fontWeight: 500 }}>{suffix}</span> : ''}
      </span>
    </div>
  );
}

function SummaryCard({ gwTotal, seasonTotal, gameweek, mode, setMode }: { gwTotal: number; seasonTotal: number; gameweek: number; mode: string; setMode: (m: string) => void }) {
  const displayTarget = mode === 'season' ? seasonTotal : gwTotal;
  const animated = useCountUp(displayTarget, 900, 300);
  const starterPts = GW_DATA.starters.reduce((s, p) => s + calcPts(p), 0);
  const benchPts = GW_DATA.bench.reduce((s, p) => s + calcPts(p), 0);
  const avgGW = (seasonTotal / gameweek).toFixed(1);
  return (
    <div style={{ margin: '4px 16px 14px', background: PAL.card, border: `1px solid ${PAL.lineDim}`, borderRadius: 18, padding: '16px 18px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -50, right: -50, width: 180, height: 180, borderRadius: '50%', background: `radial-gradient(circle, oklch(0.82 0.19 142 / 0.14), transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ padding: '4px 10px', borderRadius: 6, background: withAlpha(PAL.accent, 0.18), color: PAL.accent, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700 }}>Gameweek {gameweek}</span>
        <div style={{ flex: 1 }} />
        <div style={{ display: 'flex', background: withAlpha(PAL.bg2, 0.8), border: `1px solid ${PAL.lineDim}`, borderRadius: 8, padding: 3, gap: 2 }}>
          {(['gw', 'season'] as const).map(m => (
            <button key={m} type="button" onClick={() => setMode(m)} style={{ height: 24, padding: '0 10px', borderRadius: 6, border: 'none', background: mode === m ? PAL.accent : 'transparent', color: mode === m ? PAL.accentInk : PAL.textDim, fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 700, cursor: 'pointer', transition: 'all 140ms' }}>
              {m === 'gw' ? `GW${gameweek}` : 'Season'}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 4 }}>
        <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 60, lineHeight: 0.9, letterSpacing: '-0.05em', fontVariantNumeric: 'tabular-nums', color: PAL.text }}>{animated}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: '0.16em', color: PAL.textDim, textTransform: 'uppercase', marginBottom: 4 }}>pts</span>
      </div>
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${PAL.lineDim}`, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4 }}>
        <MiniStat label="Starters" value={starterPts} suffix="pts" />
        <MiniStat label="Bench" value={benchPts} suffix="pts" faint />
        <MiniStat label="Avg / GW" value={avgGW} />
      </div>
    </div>
  );
}

function SectionHeader({ label, count, pts, isBench }: { label: string; count: string; pts: number; isBench: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', padding: '14px 6px 6px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 12, letterSpacing: '0.04em', color: isBench ? PAL.textFaint : PAL.textDim, textTransform: 'uppercase' }}>{label}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.12em', color: PAL.textFaint }}>{count}</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
        {isBench && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: '0.12em', color: PAL.textFaint, textTransform: 'uppercase', marginRight: 4 }}>not counted</span>}
        <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 16, letterSpacing: '-0.02em', fontVariantNumeric: 'tabular-nums', color: isBench ? PAL.textFaint : PAL.text, textDecoration: isBench ? 'line-through' : 'none' }}>{pts}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: '0.12em', color: PAL.textFaint, textTransform: 'uppercase' }}>pts</span>
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────
export default function GWBreakdownScreen({ onBack }: { onBack: () => void }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [mode, setMode] = useState('gw');

  const toggle = useCallback((id: number) => {
    setExpanded(prev => prev === id ? null : id);
  }, []);

  const starterPts = GW_DATA.starters.reduce((s, p) => s + calcPts(p), 0);
  const benchPts = GW_DATA.bench.reduce((s, p) => s + calcPts(p), 0);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: PAL.bg, color: PAL.text, fontFamily: "'DM Sans', sans-serif", overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '6px 18px 8px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, background: PAL.bg, zIndex: 4 }}>
        <button type="button" aria-label="Back" onClick={onBack} style={{ width: 34, height: 34, borderRadius: '50%', border: `1px solid ${PAL.line}`, background: 'rgba(255,255,255,0.03)', color: PAL.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ flex: 1, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <BallMark size={16} />
          <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em' }}>Points</span>
        </div>
        <button type="button" aria-label="Share" style={{ width: 34, height: 34, borderRadius: '50%', border: `1px solid ${PAL.line}`, background: 'rgba(255,255,255,0.03)', color: PAL.textDim, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M10 2a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM4 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3ZM10 9a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3Z" stroke="currentColor" strokeWidth="1.3" fill="none" />
            <path d="M5.4 6.5l3.2-2M5.4 7.5l3.2 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 40 }}>
        <SummaryCard gwTotal={starterPts} seasonTotal={GW_DATA.seasonTotal} gameweek={GW_DATA.gameweek} mode={mode} setMode={setMode} />

        <div style={{ padding: '0 16px' }}>
          <SectionHeader label="Starting" count="6" pts={starterPts} isBench={false} />
          <ColHeaders />
          <div style={{ paddingTop: 4 }}>
            {GW_DATA.starters.map(p => (
              <PlayerRow key={p.id} player={p} bench={false} expanded={expanded === p.id} onToggle={toggle} />
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0 2px' }}>
            <div style={{ flex: 1, height: 1, background: PAL.lineDim }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.20em', color: PAL.textFaint, textTransform: 'uppercase' }}>bench · not counted</span>
            <div style={{ flex: 1, height: 1, background: PAL.lineDim }} />
          </div>

          <SectionHeader label="Bench" count="4" pts={benchPts} isBench={true} />
          <ColHeaders />
          <div style={{ paddingTop: 4, opacity: 0.7 }}>
            {GW_DATA.bench.map(p => (
              <PlayerRow key={p.id} player={p} bench={true} expanded={expanded === p.id} onToggle={toggle} />
            ))}
          </div>

          <div style={{ marginTop: 20, padding: '10px 14px', borderRadius: 10, background: withAlpha(PAL.accent, 0.06), border: `1px solid ${withAlpha(PAL.accent, 0.12)}`, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.08em', color: PAL.textFaint, lineHeight: 1.5 }}>
            Tap any player to see their full scoring breakdown.
          </div>
        </div>
      </div>
    </div>
  );
}

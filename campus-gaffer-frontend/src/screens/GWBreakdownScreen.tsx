import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { SQUAD_DATA_KEY, SQUAD_ID_KEY, GW_KEY } from '../lib/mockSquad';
import { readCache, writeCache } from '../lib/cache';
import { BrandMark } from '../components/BrandMark';
import { apiFetch, ApiError } from '../lib/api';
import './screen-shared.css';

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

interface PointBreakdown {
  appearance_pts: number;
  goals: number;
  goal_pts: number;
  win_pts: number;
  draw_pts: number;
  mvp_pts: number;
}

interface PlayerData {
  id: string; name: string; team: string; played: boolean;
  goals: number; result: string; mvp: boolean;
  livePoints?: number;
  breakdown?: PointBreakdown;
}

interface StoredPlayer { id: string; name: string; team: string; price: number; }
interface StoredSquad { starters: StoredPlayer[]; bench: StoredPlayer[]; }
interface ApiPointsEntry { player_id: string; name: string; team: string; is_bench: boolean; points: number; breakdown?: PointBreakdown; }
interface ApiSquadPoints { squad_id: string; total_points: number; players: ApiPointsEntry[]; }

function calcPts(p: PlayerData) {
  if (!p.played) return 0;
  return APPEARANCE + p.goals * GOAL_PTS
    + (p.result === 'W' ? WIN_PTS : p.result === 'D' ? DRAW_PTS : 0)
    + (p.mvp ? MVP_PTS : 0);
}


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
  const items: { label: string; val: number | null; note: string; star?: boolean }[] = [];

  if (player.breakdown) {
    const bd = player.breakdown;
    if (bd.appearance_pts === 0) {
      items.push({ label: 'Did not play', val: 0, note: '' });
    } else {
      items.push({ label: 'Appearance', val: bd.appearance_pts, note: '' });
      if (bd.goal_pts > 0) items.push({ label: `Goal${bd.goals > 1 ? 's' : ''}`, val: bd.goal_pts, note: `${bd.goals} × ${GOAL_PTS}` });
      if (bd.win_pts > 0) items.push({ label: 'Win bonus', val: bd.win_pts, note: bd.win_pts > WIN_PTS ? `${bd.win_pts / WIN_PTS} × ${WIN_PTS}` : '' });
      if (bd.draw_pts > 0) items.push({ label: 'Draw bonus', val: bd.draw_pts, note: bd.draw_pts > DRAW_PTS ? `${bd.draw_pts / DRAW_PTS} × ${DRAW_PTS}` : '' });
      if (bd.mvp_pts > 0) items.push({ label: 'Match MVP', val: bd.mvp_pts, note: '', star: true });
    }
    if (bench) items.push({ label: 'On bench (not counted)', val: null, note: '' });
  } else {
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
  }

  const textCol = bench ? PAL.benchText : PAL.textDim;
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

function PlayerRow({ player, bench, expanded, onToggle }: { player: PlayerData; bench: boolean; expanded: boolean; onToggle: (id: string) => void }) {
  const pts = player.livePoints ?? calcPts(player);
  const teamColor = TEAM_COLORS[player.team] || PAL.accent;
  const dim = bench;
  const isMvp = player.mvp && !bench;
  return (
    <div style={{ background: expanded ? (bench ? PAL.benchCard : PAL.cardAlt) : 'transparent', borderRadius: 14, marginBottom: 2, transition: 'background 180ms', cursor: 'pointer', overflow: 'hidden', border: `1px solid ${expanded ? PAL.line : 'transparent'}` }} onClick={() => onToggle(player.id)}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(36px,44px) minmax(36px,44px) minmax(36px,44px) minmax(36px,44px)', alignItems: 'center', padding: '0 6px', height: 52, gap: 0 }}>
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
    <div style={{ display: 'grid', gridTemplateColumns: '1fr minmax(36px,44px) minmax(36px,44px) minmax(36px,44px) minmax(36px,44px)', alignItems: 'center', padding: '0 6px', height: 32, gap: 0, borderBottom: `1px solid ${PAL.lineDim}`, position: 'sticky', top: 0, background: PAL.bg, zIndex: 3 }}>
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

function SummaryCard({ gwTotal, benchTotal, seasonTotal, gameweek, mode, setMode }: { gwTotal: number; benchTotal: number; seasonTotal: number; gameweek: number; mode: string; setMode: (m: string) => void }) {
  // Bench points are shown for transparency but are not counted totals.
  const displayTarget = mode === 'season' ? seasonTotal : gwTotal;
  const animated = useCountUp(displayTarget, 900, 300);
  const starterPts = gwTotal;
  const benchPts = benchTotal;
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
  const [expanded, setExpanded] = useState<string | null>(null);
  const [mode, setMode] = useState('gw');
  const [starters, setStarters] = useState<PlayerData[]>([]);
  const [bench, setBench] = useState<PlayerData[]>([]);
  const [hasSquad, setHasSquad] = useState(() =>
    typeof window !== 'undefined' && window.localStorage.getItem(SQUAD_ID_KEY) !== null
  );
  const [loading, setLoading] = useState(true);
  const [noSquad, setNoSquad] = useState(false);
  const [seasonTotal, setSeasonTotal] = useState(0);
  const [gameweek] = useState(() => {
    if (typeof window === 'undefined') return 7;
    const stored = window.localStorage.getItem(GW_KEY);
    return stored ? parseInt(stored, 10) : 7;
  });
  const { userId } = useAuth();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const ctrl = new AbortController();

    const nameMap = new Map<string, { name: string; team: string }>();
    const rawSquad = window.localStorage.getItem(SQUAD_DATA_KEY);
    if (rawSquad) {
      try {
        const stored: StoredSquad = JSON.parse(rawSquad);
        [...(stored.starters || []), ...(stored.bench || [])].forEach(p => {
          nameMap.set(p.id, { name: p.name, team: p.team || '' });
        });
      } catch { /* ignore */ }
    }

    const toRow = (entry: ApiPointsEntry): PlayerData => {
      const bd = entry.breakdown;
      return {
        id: entry.player_id,
        name: entry.name || nameMap.get(entry.player_id)?.name || entry.player_id.slice(0, 8),
        team: entry.team || nameMap.get(entry.player_id)?.team || '',
        played: bd ? bd.appearance_pts > 0 : true,
        goals: bd?.goals ?? 0,
        result: bd
          ? bd.win_pts > 0 ? 'W' : bd.draw_pts > 0 ? 'D' : bd.appearance_pts > 0 ? 'L' : ''
          : '',
        mvp: bd ? bd.mvp_pts > 0 : false,
        livePoints: entry.points,
        breakdown: bd,
      };
    };

    (async () => {
      // Resolve squad ID: localStorage → VITE_DEFAULT_SQUAD_ID env var → user lookup
      let squadId: string | null = window.localStorage.getItem(SQUAD_ID_KEY);

      if (!squadId) {
        const envId = (import.meta.env.VITE_DEFAULT_SQUAD_ID as string | undefined) || '';
        if (envId) {
          squadId = envId;
          window.localStorage.setItem(SQUAD_ID_KEY, envId);
        }
      }

      // Track whether the user-squad lookup itself failed in a non-404 way,
      // so we don't collapse generic network errors into the "no squad" UI.
      let lookupErrored = false;
      if (!squadId) {
        const userId = window.localStorage.getItem(USER_ID_KEY);
        if (userId) {
          try {
            const data = await apiFetch<{ squad_id: string }>('/users/me/squad', { signal: ctrl.signal });
            squadId = data.squad_id;
            window.localStorage.setItem(SQUAD_ID_KEY, squadId);
          } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') return;
            // 404 = canonical "no squad yet". Anything else (network, 5xx)
            // is a real error and must not be misrepresented as empty.
            if (!(err instanceof ApiError && err.status === 404)) {
              lookupErrored = true;
            }
          }
        }
      }

      if (!squadId) {
        setLoading(false);
        // Only enter the noSquad branch when we're confident the user has
        // no squad. On a non-404 lookup failure, leave noSquad false so the
        // screen renders its existing empty-data fallback instead.
        setNoSquad(!lookupErrored);
        return;
      }

      // Cache hit: squad-points data is immutable within a gameweek.
      // Render instantly and skip the network round-trip entirely.
      const cacheKey = `squad-pts:${squadId}`;
      const cached = readCache<ApiSquadPoints>(cacheKey);
      if (cached) {
        setSeasonTotal(cached.total_points);
        setStarters(cached.players.filter(p => !p.is_bench).map(toRow));
        setBench(cached.players.filter(p => p.is_bench).map(toRow));
        setHasSquad(true);
        setNoSquad(false);
        setLoading(false);
        return;
      }

      try {
        const data = await apiFetch<ApiSquadPoints>(`/squads/${squadId}/points`, { signal: ctrl.signal });
        writeCache(cacheKey, data);
        setSeasonTotal(data.total_points);
        setStarters(data.players.filter(p => !p.is_bench).map(toRow));
        setBench(data.players.filter(p => p.is_bench).map(toRow));
        setHasSquad(true);
        setNoSquad(false);
        setLoading(false);
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') return;
        setLoading(false);
        // 404 from the points endpoint means the squad we believed we had
        // was deleted server-side (e.g. by a cleanup migration). Treat as
        // noSquad. Generic errors leave noSquad false so the existing
        // fallback rendering takes over instead of a misleading empty UI.
        setNoSquad(err instanceof ApiError && err.status === 404);
      }
    })();

    return () => ctrl.abort();
  }, [userId]);

  const toggle = useCallback((id: string) => {
    setExpanded(prev => prev === id ? null : id);
  }, []);

  const starterPts = (hasSquad ? starters : []).reduce((s, p) => s + (p.livePoints ?? calcPts(p)), 0);
  const benchPts = (hasSquad ? bench : []).reduce((s, p) => s + (p.livePoints ?? calcPts(p)), 0);

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
          <BrandMark size={16} />
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
        <SummaryCard gwTotal={starterPts} benchTotal={benchPts} seasonTotal={seasonTotal} gameweek={gameweek} mode={mode} setMode={setMode} />

        <div style={{ padding: '0 16px' }}>
          {loading && (
            <div style={{ padding: '32px 0', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.14em', color: PAL.textFaint, textTransform: 'uppercase' }}>
              Loading…
            </div>
          )}
          {!loading && noSquad && (
            <div style={{ padding: '32px 16px', textAlign: 'center' }}>
              <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 17, color: PAL.text, marginBottom: 8 }}>No squad yet</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.10em', color: PAL.textFaint, lineHeight: 1.6 }}>Draft your squad to start tracking live points.</div>
            </div>
          )}
          {!loading && !noSquad && (<>
          <SectionHeader label="Starting" count={`${starters.length}`} pts={starterPts} isBench={false} />
          <ColHeaders />
          <div style={{ paddingTop: 4 }}>
            {starters.map(p => (
              <PlayerRow key={p.id} player={p} bench={false} expanded={expanded === p.id} onToggle={toggle} />
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '8px 0 2px' }}>
            <div style={{ flex: 1, height: 1, background: PAL.lineDim }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.20em', color: PAL.textFaint, textTransform: 'uppercase' }}>bench · not counted</span>
            <div style={{ flex: 1, height: 1, background: PAL.lineDim }} />
          </div>

          <SectionHeader label="Bench" count={`${bench.length}`} pts={benchPts} isBench={true} />
          <ColHeaders />
          <div style={{ paddingTop: 4, opacity: 0.7 }}>
            {bench.map(p => (
              <PlayerRow key={p.id} player={p} bench={true} expanded={expanded === p.id} onToggle={toggle} />
            ))}
          </div>

          <div style={{ marginTop: 20, padding: '10px 14px', borderRadius: 10, background: withAlpha(PAL.accent, 0.06), border: `1px solid ${withAlpha(PAL.accent, 0.12)}`, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.08em', color: PAL.textFaint, lineHeight: 1.5 }}>
            Tap any player to see their full scoring breakdown.
          </div>
          </>)}
        </div>
      </div>
    </div>
  );
}

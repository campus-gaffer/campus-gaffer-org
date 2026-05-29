import { useEffect, useMemo, useState } from 'react';
import './screen-shared.css';
import { useFormation } from '../context/FormationContext';
import { SQUAD, SQUAD_DATA_KEY, SQUAD_ID_KEY, GW_KEY } from '../lib/mockSquad';
import { apiFetch } from '../lib/api';

const PAL = {
  bg2: 'oklch(0.10 0.02 248)',
  card: 'oklch(0.17 0.03 248)',
  cardDark: 'oklch(0.13 0.025 248)',
  cardGlass: 'rgba(12, 17, 30, 0.86)',
  line: 'oklch(0.28 0.04 248)',
  lineDim: 'oklch(0.22 0.03 248)',
  accent: 'oklch(0.82 0.19 142)',
  pitch1: 'oklch(0.55 0.13 145)',
  pitch2: 'oklch(0.48 0.13 145)',
  pitchLine: 'rgba(255,255,255,0.34)',
  text: '#fff',
  textDim: 'rgba(235,235,245,0.65)',
  textFaint: 'rgba(235,235,245,0.45)',
  starGlow: 'oklch(0.85 0.18 95)',
};

const TEAM_COLORS: Record<string, string> = {
  KCS: 'oklch(0.70 0.16 25)', TRN: 'oklch(0.60 0.14 260)', WAD: 'oklch(0.78 0.15 80)',
  STJ: 'oklch(0.70 0.15 340)', PMB: 'oklch(0.70 0.12 195)', MED: 'oklch(0.72 0.16 50)',
  ENG: 'oklch(0.70 0.15 305)', LAW: 'oklch(0.62 0.16 10)', HIL: 'oklch(0.72 0.14 150)',
  NTH: 'oklch(0.72 0.14 220)',
};

interface Player {
  id: string; surname: string; squadNum: number; team: string;
  price: number; pts: number; mvp?: boolean;
}

// SQUAD data moved to shared module `src/lib/mockSquad.ts`

const SEASON_TOTAL = 142;
const RANK = 1847;

function partitionByFormation(flat: Player[], pattern: number[]) {
  const rows: Player[][] = [];
  let i = 0;
  for (const n of pattern) { rows.push(flat.slice(i, i + n)); i += n; }
  return rows;
}

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

function PitchBackground() {
  const { pitch1, pitch2, pitchLine } = PAL;
  return (
    <svg width="100%" height="100%" viewBox="0 0 358 420" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0 }} aria-hidden="true">
      <defs>
        <linearGradient id="pitchGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={pitch1} />
          <stop offset="100%" stopColor={pitch2} />
        </linearGradient>
      </defs>
      <rect width="358" height="420" fill="url(#pitchGrad)" />
      <rect x="8" y="8" width="342" height="404" fill="none" stroke={pitchLine} strokeWidth="1.2" />
      <line x1="8" y1="210" x2="350" y2="210" stroke={pitchLine} strokeWidth="1.2" />
      <circle cx="179" cy="210" r="44" fill="none" stroke={pitchLine} strokeWidth="1.2" />
      <rect x="79" y="8" width="200" height="58" fill="none" stroke={pitchLine} strokeWidth="1.2" />
      <rect x="129" y="8" width="100" height="22" fill="none" stroke={pitchLine} strokeWidth="1.2" />
      <rect x="79" y="354" width="200" height="58" fill="none" stroke={pitchLine} strokeWidth="1.2" />
      <rect x="129" y="390" width="100" height="22" fill="none" stroke={pitchLine} strokeWidth="1.2" />
    </svg>
  );
}

function AttackingOverlay() {
  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 358 420"
      preserveAspectRatio="none"
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <defs>
        <marker id="attackArrow" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="oklch(0.82 0.19 142 / 0.85)" />
        </marker>
      </defs>
      <line x1="120" y1="54" x2="120" y2="350" stroke="oklch(0.82 0.19 142 / 0.35)" strokeWidth="1.8" strokeDasharray="5 6" markerEnd="url(#attackArrow)" />
      <line x1="179" y1="38" x2="179" y2="362" stroke="oklch(0.82 0.19 142 / 0.45)" strokeWidth="2.2" strokeDasharray="6 6" markerEnd="url(#attackArrow)" />
      <line x1="238" y1="54" x2="238" y2="350" stroke="oklch(0.82 0.19 142 / 0.35)" strokeWidth="1.8" strokeDasharray="5 6" markerEnd="url(#attackArrow)" />
      <rect x="12" y="18" width="334" height="116" fill="oklch(0.82 0.19 142 / 0.10)" />
      <rect x="12" y="134" width="334" height="118" fill="oklch(0.82 0.19 142 / 0.07)" />
      <rect x="12" y="252" width="334" height="150" fill="oklch(0.82 0.19 142 / 0.04)" />
      <text x="18" y="34" fontFamily="'JetBrains Mono', monospace" fontSize="8.5" letterSpacing="0.18em" fill="rgba(235,235,245,0.72)">DEF</text>
      <text x="18" y="208" fontFamily="'JetBrains Mono', monospace" fontSize="8.5" letterSpacing="0.18em" fill="rgba(235,235,245,0.72)">MID</text>
      <text x="18" y="382" fontFamily="'JetBrains Mono', monospace" fontSize="8.5" letterSpacing="0.18em" fill="rgba(235,235,245,0.72)">FWD</text>
    </svg>
  );
}

function StarterTile({ p }: { p: Player }) {
  const teamColor = TEAM_COLORS[p.team] || PAL.accent;
  return (
    <div style={{ width: 'min(19vw, 82px)', minWidth: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
      {p.mvp && (
        <div style={{ position: 'absolute', top: -4, right: '8%', zIndex: 4, width: 17, height: 17, borderRadius: '50%', background: PAL.starGlow, color: '#1a1503', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 9, border: '2px solid rgba(10,15,28,0.95)' }}>★</div>
      )}
      <div style={{ marginBottom: -10, zIndex: 2 }}>
        <Jersey color={teamColor} num={p.squadNum} size={30} />
      </div>
      <div style={{ width: '100%', background: PAL.cardGlass, border: `1px solid rgba(255,255,255,${p.mvp ? 0.18 : 0.09})`, borderRadius: 10, paddingTop: 14, textAlign: 'center', overflow: 'hidden' }}>
        <div style={{ padding: '0 4px 5px' }}>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 'clamp(10px,2.4vw,12px)', color: PAL.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.surname}</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 'clamp(7px,2vw,9px)', color: PAL.textFaint }}>£{p.price.toFixed(1)}</div>
        </div>
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '4px 6px', display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: 4 }}>
          <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 'clamp(12px,3.4vw,14px)', color: p.pts >= 10 ? PAL.accent : PAL.text }}>{p.pts}</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 'clamp(7px,1.9vw,8px)', color: PAL.textFaint, textTransform: 'uppercase' }}>pts</span>
        </div>
      </div>
    </div>
  );
}

function BenchTile({ p }: { p: Player }) {
  const teamColor = TEAM_COLORS[p.team] || PAL.accent;
  const didntPlay = p.pts === 0;
  return (
    <div style={{ background: PAL.cardDark, border: `1px solid ${PAL.lineDim}`, borderRadius: 10, position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 22 }}>
      <div style={{ position: 'absolute', top: -16, left: '50%', transform: 'translateX(-50%)' }}>
        <Jersey color={teamColor} num={p.squadNum} size={38} dim={didntPlay} />
      </div>
      <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 'clamp(11px,3vw,12px)', color: didntPlay ? PAL.textFaint : PAL.text, marginTop: 2 }}>{p.surname}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 'clamp(8px,2.1vw,9px)', color: PAL.textFaint, marginBottom: 6 }}>£{p.price.toFixed(1)}</div>
      <div style={{ width: '100%', borderTop: '1px solid rgba(255,255,255,0.06)', padding: '5px 0', display: 'flex', justifyContent: 'center', gap: 4 }}>
        <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 'clamp(13px,3.4vw,15px)', color: didntPlay ? PAL.textFaint : PAL.text }}>{p.pts}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 'clamp(7px,1.9vw,8px)', color: PAL.textFaint, textTransform: 'uppercase' }}>pts</span>
      </div>
    </div>
  );
}

function ScoreCard({ gameweek, seasonTotal, gwStarterPts }: { gameweek: number; seasonTotal: number; gwStarterPts: number }) {
  const seasonAvg = (seasonTotal / Math.max(gameweek, 1)).toFixed(1);
  return (
    <div className="info-card" style={{ background: PAL.card, borderColor: PAL.lineDim, boxShadow: '0 8px 28px -16px rgba(0,0,0,0.6)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <span style={{ padding: '4px 10px', borderRadius: 6, background: 'oklch(0.82 0.19 142 / 0.18)', color: PAL.accent, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 700 }}>Gameweek {gameweek}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.18em', color: PAL.textDim, textTransform: 'uppercase' }}>Squad Locked</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
          <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 'clamp(44px,12vw,60px)', lineHeight: 0.9, color: PAL.text }}>{seasonTotal}</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: '0.16em', color: PAL.textDim, textTransform: 'uppercase' }}>pts</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
          <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 'clamp(18px,6vw,22px)', color: PAL.accent }}>+{gwStarterPts}</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.14em', color: PAL.accent, textTransform: 'uppercase' }}>GW{gameweek}</span>
        </div>
      </div>
      <div style={{ marginTop: 14, paddingTop: 12, borderTop: `1px solid ${PAL.lineDim}`, display: 'grid', gridTemplateColumns: 'repeat(3,minmax(0,1fr))', gap: 8 }}>
        <MiniStat label="Squad Value" value="£63.0" />
        <MiniStat label="Avg / GW" value={seasonAvg} />
        <MiniStat label="Rank" value={`#${RANK.toLocaleString()}`} />
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: '0.18em', color: PAL.textFaint, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 'clamp(15px,4.2vw,17px)', color: PAL.text }}>{value}</div>
    </div>
  );
}

function toPlayer(p: unknown): Player {
  const item = p as Record<string, unknown>;
  return {
    id: String(item.id ?? ''),
    surname: String(item.name ?? '').split(' ').slice(-1)[0] || 'Player',
    squadNum: Number(item.squadNum) || Math.floor(Math.random() * 99) + 1,
    team: String(item.team ?? ''),
    price: Number(item.price ?? 0),
    pts: Number(item.pts ?? 0),
    mvp: Boolean(item.mvp),
  };
}

export default function SquadScreen({ onBack }: { onBack: () => void }) {
  const { formation, formationLabel } = useFormation();
  const persisted = typeof window !== 'undefined' ? window.localStorage.getItem(SQUAD_DATA_KEY) : null;
  const fallbackStarters = useMemo(
    () => SQUAD.starters.map((p) => ({ ...p, id: String(p.id) })),
    []
  );
  const fallbackBench = useMemo(
    () => SQUAD.bench.map((p) => ({ ...p, id: String(p.id) })),
    []
  );
  const initialStarters: Player[] = useMemo(() => {
    if (!persisted) return fallbackStarters;
    try {
      const parsed = JSON.parse(persisted, (key, value) => {
        if (key === 'starters' || key === 'bench') {
          return Array.isArray(value) ? value.map((p: unknown) => toPlayer(p)) : value;
        }
        return value;
      }) as { starters?: Player[]; bench?: Player[] };
      return parsed.starters ?? fallbackStarters;
    } catch {
      return fallbackStarters;
    }
  }, [persisted, fallbackStarters]);

  const initialBench: Player[] = useMemo(() => {
    if (!persisted) return fallbackBench;
    try {
      const parsed = JSON.parse(persisted, (key, value) => {
        if (key === 'starters' || key === 'bench') {
          return Array.isArray(value) ? value.map((p: unknown) => toPlayer(p)) : value;
        }
        return value;
      }) as { starters?: Player[]; bench?: Player[] };
      return parsed.bench ?? fallbackBench;
    } catch {
      return fallbackBench;
    }
  }, [persisted, fallbackBench]);

  const [liveStarters, setLiveStarters] = useState<Player[]>(initialStarters);
  const [liveBench, setLiveBench] = useState<Player[]>(initialBench);
  const [seasonTotal, setSeasonTotal] = useState(SEASON_TOTAL);
  const [gameweek, setGameweek] = useState(() => {
    if (typeof window === 'undefined') return 7;
    const stored = window.localStorage.getItem(GW_KEY);
    return stored ? parseInt(stored, 10) : 7;
  });

  useEffect(() => {
    setLiveStarters(initialStarters);
    setLiveBench(initialBench);
  }, [initialStarters, initialBench]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = window.localStorage.getItem(GW_KEY);
    if (stored) setGameweek(parseInt(stored, 10));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const squadId = window.localStorage.getItem(SQUAD_ID_KEY);
    if (!squadId) return;

    apiFetch<{ total_points: number; players: Array<{ player_id: string; team: string; points: number; breakdown?: { mvp_pts?: number } }> }>(`/squads/${squadId}/points`)
      .then((data) => {
        const pointsById = new Map(data.players.map((p) => [p.player_id, p]));
        setLiveStarters((prev) => prev.map((p) => {
          const row = pointsById.get(p.id);
          if (!row) return p;
          return { ...p, team: row.team || p.team, pts: row.points, mvp: Boolean(row.breakdown?.mvp_pts && row.breakdown.mvp_pts > 0) };
        }));
        setLiveBench((prev) => prev.map((p) => {
          const row = pointsById.get(p.id);
          if (!row) return p;
          return { ...p, team: row.team || p.team, pts: row.points, mvp: Boolean(row.breakdown?.mvp_pts && row.breakdown.mvp_pts > 0) };
        }));
        setSeasonTotal(data.total_points);
      })
      .catch(() => {
        // Keep local fallback rendering when API is unavailable.
      });
  }, []);

  const rows = useMemo(() => partitionByFormation(liveStarters, formation as number[]), [formation, liveStarters]);
  const starterPoints = liveStarters.reduce((s: number, p: Player) => s + p.pts, 0);
  const benchPoints = liveBench.reduce((s: number, p: Player) => s + p.pts, 0);
  const [showAttackGuides, setShowAttackGuides] = useState<boolean>(() => {
    const flag = (import.meta.env.VITE_SHOW_ATTACK_GUIDES as string | undefined) || 'true';
    return flag !== 'false';
  });

  return (
    <div className="screen-shell" style={{ background: PAL.bg2, color: PAL.text }}>
      <div className="screen-topbar" style={{ background: PAL.bg2 }}>
        <button type="button" aria-label="Back" onClick={onBack} className="icon-btn" style={{ borderColor: PAL.line, color: PAL.text }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
        <div className="screen-title">My Squad</div>
        <button type="button" aria-label="More" className="icon-btn" style={{ borderColor: PAL.line, color: PAL.textDim }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="3" cy="7" r="1.2" fill="currentColor" /><circle cx="7" cy="7" r="1.2" fill="currentColor" /><circle cx="11" cy="7" r="1.2" fill="currentColor" /></svg>
        </button>
      </div>

      <div className="screen-scroll">
        <ScoreCard gameweek={gameweek} seasonTotal={seasonTotal} gwStarterPts={starterPoints} />

        <div style={{ margin: '0 16px', position: 'relative', borderRadius: 18, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.06)', aspectRatio: '358 / 420', minHeight: 320, maxHeight: '62dvh', boxShadow: '0 12px 28px -16px rgba(0,0,0,0.5)' }}>
          <PitchBackground />
          {showAttackGuides && <AttackingOverlay />}
          <div style={{ position: 'absolute', top: 10, left: 12, zIndex: 4, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.20em', color: 'rgba(255,255,255,0.78)', textTransform: 'uppercase', background: 'rgba(0,0,0,0.32)', padding: '3px 8px', borderRadius: 4 }}>
            {formationLabel}</div>
          <button
            type="button"
            onClick={() => setShowAttackGuides((v) => !v)}
            style={{
              position: 'absolute',
              top: 10,
              right: 12,
              zIndex: 5,
              border: '1px solid rgba(255,255,255,0.18)',
              background: 'rgba(0,0,0,0.32)',
              color: 'rgba(235,235,245,0.82)',
              borderRadius: 6,
              padding: '3px 8px',
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 9,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              cursor: 'pointer',
            }}
          >
            {showAttackGuides ? 'Guides On' : 'Guides Off'}
          </button>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-around', padding: '20px 8px 12px', zIndex: 3 }}>
            {rows.map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-around', gap: 4 }}>
                {row.map((p) => {
                  return <StarterTile key={p.id} p={p} />;
                })}
              </div>
            ))}
          </div>
        </div>

        <div style={{ margin: '10px 16px 0' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10, gap: 8 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.22em', color: PAL.text, textTransform: 'uppercase' }}>Bench</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 'clamp(9px,2.4vw,10px)', letterSpacing: '0.14em', color: PAL.textFaint, textTransform: 'uppercase' }}>4 Players · 0 Subs (Locked) · {benchPoints} pts</span>
          </div>
          <div style={{ background: 'rgba(255,255,255,0.025)', border: `1px solid ${PAL.lineDim}`, borderRadius: 14, padding: '24px 10px 10px', display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 8 }}>
            {liveBench.map((p) => <BenchTile key={p.id} p={p} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

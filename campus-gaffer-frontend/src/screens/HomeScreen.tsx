import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { SQUAD_DATA_KEY, GW_KEY, SQUAD_ID_KEY } from '../lib/mockSquad';
import { useFormation } from '../context/FormationContext';
import { BrandMark } from '../components/BrandMark';
import { ScreenShell } from '../layouts/ScreenShell';
import { THEME, withAlpha } from '../lib/theme';
import { apiFetch, getMe, type Me } from '../lib/api';
import NotificationsSheet, { type NotificationItem } from '../components/NotificationsSheet';

type NavTarget = 'squad' | 'leaderboard' | 'breakdown' | 'profile';

const HM = THEME;
const FALLBACK_DEADLINE = new Date('2026-05-23T14:00:00');
const FALLBACK_GAMEWEEK = 7;

// Current user's standings, resolved from GET /leaderboard. Null until loaded
// (or when the user has no squad / the API is unreachable).
type UserStats = { seasonPts: number; gwPts: number; rank: number; total: number };

// GW match results have no backing API yet — left static until a results
// endpoint exists. See ResultsCard.
const LAST_GW = { gw: 7, home: "King's", away: 'Trinity', score: '3 - 1', topScorer: 'Doyle', topPts: 11 };

function formatDeadlineLabel(d: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]} · ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// ─── Countdown hook ────────────────────────────────────────────────────────
function useCountdown(target: number) {
  const [diff, setDiff] = useState<number>(0);
  useEffect(() => {
    // initialize diff inside effect to avoid calling impure Date.now() during render
    // defer the initial setState to avoid a synchronous setState inside the effect
    const init = setTimeout(() => setDiff(Math.max(0, target - Date.now())), 0);
    const id = setInterval(() => setDiff(Math.max(0, target - Date.now())), 1000);
    return () => {
      clearTimeout(init);
      clearInterval(id);
    };
  }, [target]);
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s, expired: diff === 0 };
}

function MiniPitch({ formation }: { formation: readonly number[] }) {
  const a = HM.accent;
  const rowYs = [7, 22, 37];
  const rowLayouts: Record<number, number[]> = {
    1: [26],
    2: [14, 38],
    3: [10, 26, 42],
  };

  return (
    <svg width="52" height="44" viewBox="0 0 52 44" aria-hidden="true">
      <rect x="1" y="1" width="50" height="42" rx="4" fill="none" stroke={withAlpha(a, 0.13)} strokeWidth="1" />
      <line x1="1" y1="22" x2="51" y2="22" stroke={withAlpha(a, 0.13)} strokeWidth="0.8" />
      <circle cx="26" cy="22" r="7" fill="none" stroke={withAlpha(a, 0.13)} strokeWidth="0.8" />
      {formation.map((count, ri) =>
        (rowLayouts[count] || []).map((cx) => (
          <circle
            key={`${ri}-${cx}`}
            cx={cx}
            cy={rowYs[ri] ?? 37}
            r="4"
            fill={a}
            opacity={ri === 0 ? 1 : 0.7}
          />
        ))
      )}
    </svg>
  );
}

function RankBar({ rank, total }: { rank: number; total: number }) {
  const pct = 1 - (rank - 1) / (total - 1);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: '100%' }}>
      <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.07)', borderRadius: 2, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: `${pct * 100}%`, background: HM.accent, borderRadius: 2, transition: 'width 600ms cubic-bezier(.4,0,.2,1)' }} />
        <div style={{ position: 'absolute', top: -2, bottom: -2, left: `${pct * 100}%`, transform: 'translateX(-50%)', width: 6, background: HM.accent, borderRadius: 3, boxShadow: `0 0 6px ${HM.accent}` }} />
      </div>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.10em', color: withAlpha(HM.accent, 0.6), flexShrink: 0 }}>
        TOP {Math.round((1 - (rank - 1) / (total - 1)) * 100)}%
      </span>
    </div>
  );
}

function CDUnit({ val, label, warn }: { val: number; label: string; warn: boolean }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <span style={{
        fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 22,
        lineHeight: 1, letterSpacing: '-0.04em', fontVariantNumeric: 'tabular-nums',
        color: warn ? HM.warn : HM.text, minWidth: 28, textAlign: 'center',
      }}>{String(val).padStart(2, '0')}</span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8, letterSpacing: '0.18em', color: HM.textFaint, textTransform: 'uppercase' }}>{label}</span>
    </div>
  );
}

function CDSep() {
  return (
    <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 18, color: HM.textFaint, alignSelf: 'flex-start', marginTop: 2, paddingBottom: 14 }}>:</span>
  );
}

function Arrow({ color }: { color?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M3 7h8M7 3l4 4-4 4" stroke={color || 'currentColor'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Card shell ────────────────────────────────────────────────────────────
function Card({ children, hero, onClick }: { children: React.ReactNode; hero?: boolean; onClick?: () => void }) {
  const [pressed, setPressed] = useState(false);
  return (
    <div
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      onClick={onClick}
      style={{
        background: hero ? HM.hero : HM.card,
        border: `1px solid ${hero ? HM.heroBorder : HM.lineDim}`,
        borderRadius: 18, padding: '16px 16px 14px',
        position: 'relative', overflow: 'hidden',
        cursor: onClick ? 'pointer' : 'default',
        transform: pressed ? 'scale(0.97)' : 'scale(1)',
        transition: 'transform 120ms ease, box-shadow 120ms',
        boxShadow: hero ? `0 8px 28px -12px ${HM.accent}` : '0 4px 16px -10px rgba(0,0,0,0.4)',
        display: 'flex', flexDirection: 'column',
      }}
    >
      {hero && (
        <>
          <div style={{ position: 'absolute', top: -60, right: -40, width: 180, height: 180, borderRadius: '50%', background: `radial-gradient(circle, ${withAlpha(HM.accent, 0.16)}, transparent 68%)`, pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', inset: 0, opacity: 0.07, pointerEvents: 'none', background: `repeating-linear-gradient(0deg, ${HM.accent} 0px, ${HM.accent} 1px, transparent 1px, transparent 32px)` }} />
        </>
      )}
      {children}
    </div>
  );
}

function CardLabel({ text, hero }: { text: string; hero?: boolean }) {
  return (
    <span style={{
      fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: '0.22em',
      textTransform: 'uppercase', color: hero ? HM.accent : HM.textFaint, fontWeight: 700,
      marginBottom: 8, display: 'block',
    }}>{text}</span>
  );
}

// ─── Dashboard cards ───────────────────────────────────────────────────────
function MySquadCard({ onNav, gameweek, stats }: { onNav: () => void; gameweek: number; stats: UserStats | null }) {
  const { formation } = useFormation();
  const hasSquad = typeof window !== 'undefined' && window.localStorage.getItem(SQUAD_DATA_KEY) !== null;
  return (
    <Card hero onClick={onNav}>
      <CardLabel text="My Squad" hero />
      <div style={{ flex: 1 }}>
        {hasSquad ? (
          <>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 42, lineHeight: 0.9, letterSpacing: '-0.05em', fontVariantNumeric: 'tabular-nums', color: HM.text }}>{stats ? stats.seasonPts : '—'}</span>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.14em', color: HM.accentDim, textTransform: 'uppercase', marginBottom: 2 }}>pts</span>
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.10em', color: HM.textDim, marginTop: 4 }}>
              GW{gameweek} · {stats && stats.rank > 0 ? `#${stats.rank} rank` : 'unranked'}
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 20, color: HM.text }}>No squad yet</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: HM.textFaint }}>Create your squad to start earning points and appear on the leaderboard.</div>
            <div style={{ marginTop: 6 }}>
              <button type="button" onClick={onNav} style={{ padding: '8px 12px', borderRadius: 10, background: HM.accent, color: '#08120a', border: 'none', fontWeight: 700 }}>Create squad</button>
            </div>
          </div>
        )}
        {/* <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: '0.16em', color: HM.accentDim, textTransform: 'uppercase', marginTop: 6 }}>
          {formationLabel}
        </div> */}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 10 }}>
        <MiniPitch formation={formation} />
        <span style={{ color: HM.accent }}><Arrow /></span>
      </div>
    </Card>
  );
}

function LeaderboardCard({ onNav, stats }: { onNav: () => void; stats: UserStats | null }) {
  return (
    <Card onClick={onNav}>
      <CardLabel text="Leaderboard" />
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: '-0.01em', color: HM.textFaint, marginBottom: 2 }}>#</span>
          <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 42, lineHeight: 0.9, letterSpacing: '-0.05em', fontVariantNumeric: 'tabular-nums', color: HM.text }}>{stats && stats.rank > 0 ? stats.rank : '—'}</span>
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.10em', color: HM.textFaint, marginTop: 4 }}>
          of {stats ? stats.total : '—'} players
        </div>
      </div>
      <div style={{ marginTop: 10 }}>
        {stats && stats.total > 1 && <RankBar rank={stats.rank} total={stats.total} />}
      </div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
        <span style={{ color: HM.textFaint }}><Arrow /></span>
      </div>
    </Card>
  );
}

function DeadlineCard({ gameweek, deadline }: { gameweek: number; deadline: Date }) {
  const { d, h, m, s, expired } = useCountdown(deadline.getTime());
  const isUrgent = d === 0 && h < 6;
  return (
    <Card>
      <CardLabel text="Next Deadline" />
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: '0.18em', color: isUrgent ? HM.warn : HM.accent, textTransform: 'uppercase', fontWeight: 700, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
        {isUrgent && <span style={{ width: 6, height: 6, borderRadius: '50%', background: HM.warn, display: 'inline-block', animation: 'hm-pulse 1.6s ease-in-out infinite', flexShrink: 0 }} />}
        GW{gameweek + 1}
      </div>
      {expired ? (
        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 15, color: HM.warn }}>Deadline passed</div>
      ) : (
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4 }}>
          <CDUnit val={d} label="d" warn={isUrgent} />
          <CDSep />
          <CDUnit val={h} label="h" warn={isUrgent} />
          <CDSep />
          <CDUnit val={m} label="m" warn={isUrgent} />
          <CDSep />
          <CDUnit val={s} label="s" warn={isUrgent} />
        </div>
      )}
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.10em', color: HM.textFaint, textTransform: 'uppercase', marginTop: 8 }}>
        {formatDeadlineLabel(deadline)}
      </div>
    </Card>
  );
}

function ResultsCard({ onNav, gameweek }: { onNav: () => void; gameweek: number }) {
  return (
    <Card onClick={onNav}>
      <CardLabel text={`GW${gameweek} Results`} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: '0.10em', color: HM.textFaint, textTransform: 'uppercase', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{LAST_GW.home}</span>
        <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: '-0.03em', color: HM.text, whiteSpace: 'nowrap', fontVariantNumeric: 'tabular-nums' }}>{LAST_GW.score}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: '0.10em', color: HM.textFaint, textTransform: 'uppercase', flex: 1, textAlign: 'right', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{LAST_GW.away}</span>
      </div>
      <div style={{ height: 1, background: HM.lineDim, marginBottom: 8 }} />
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 13, color: HM.gold, flexShrink: 0 }}>★</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 13.5, color: HM.text, letterSpacing: '-0.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{LAST_GW.topScorer}</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: '0.08em', color: HM.textFaint }}>{LAST_GW.topPts} pts this GW</div>
        </div>
        <span style={{ color: HM.textFaint, flexShrink: 0 }}><Arrow /></span>
      </div>
    </Card>
  );
}

// ─── Tab bar ───────────────────────────────────────────────────────────────
const TABS = [
  {
    id: 'home', label: 'Home', icon: (active: boolean, c: string) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M3 9.5L11 3l8 6.5V19a1 1 0 0 1-1 1H14v-5H8v5H4a1 1 0 0 1-1-1V9.5Z"
          stroke={c} strokeWidth="1.6" fill={active ? c : 'none'} strokeLinejoin="round" />
      </svg>
    )
  },
  {
    id: 'squad', label: 'Squad', icon: (active: boolean, c: string) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <path d="M4 6L7 3h3c.7 2 4.3 2 5 0h3l3 3-2 5-2-1.5V19H6V12.5L4 14 2 9Z"
          stroke={c} strokeWidth="1.5" fill={active ? c : 'none'} strokeLinejoin="round" />
      </svg>
    )
  },
  {
    id: 'leaderboard', label: 'Rankings', icon: (active: boolean, c: string) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <rect x="2" y="12" width="5" height="9" rx="1" stroke={c} strokeWidth="1.5" fill={active ? c : 'none'} />
        <rect x="8.5" y="7" width="5" height="14" rx="1" stroke={c} strokeWidth="1.5" fill={active ? c : 'none'} />
        <rect x="15" y="3" width="5" height="18" rx="1" stroke={c} strokeWidth="1.5" fill={active ? c : 'none'} />
      </svg>
    )
  },
  {
    id: 'profile', label: 'Profile', icon: (active: boolean, c: string) => (
      <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
        <circle cx="11" cy="7" r="4" stroke={c} strokeWidth="1.5" fill={active ? c : 'none'} />
        <path d="M3 19c0-4 3.6-7 8-7s8 3 8 7" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    )
  },
];

function TabBar({ active, onChange }: { active: string; onChange: (id: string) => void }) {
  return (
    <div style={{ height: 72, flexShrink: 0, background: HM.tabBg, borderTop: `1px solid ${HM.lineDim}`, display: 'flex', alignItems: 'flex-start', paddingTop: 8, zIndex: 10 }}>
      {TABS.map(tab => {
        const isActive = active === tab.id;
        const color = isActive ? HM.accent : HM.textFaint;
        return (
          <button key={tab.id} type="button" onClick={() => onChange(tab.id)} style={{ flex: 1, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '6px 4px 0' }}>
            {tab.icon(isActive, color)}
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.10em', textTransform: 'uppercase', color, fontWeight: isActive ? 700 : 400, transition: 'color 140ms' }}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ─── Profile placeholder ───────────────────────────────────────────────────
function ProfileView() {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '0 32px', textAlign: 'center' }}>
      <div style={{ fontSize: 40 }}>👤</div>
      <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 20, color: HM.text }}>Profile</span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.12em', color: HM.textFaint, textTransform: 'uppercase', lineHeight: 1.6 }}>
        Coming soon
      </span>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────
export default function HomeScreen({ onNavigate }: { onNavigate: (s: NavTarget) => void }) {
  const [activeTab, setActiveTab] = useState('home');
  const [gameweek, setGameweek] = useState(FALLBACK_GAMEWEEK);
  const [deadline, setDeadline] = useState<Date>(FALLBACK_DEADLINE);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [me, setMe] = useState<Me | null>(null);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { userId } = useAuth();

  // useCountdown returns a stable, pure-logic snapshot of time remaining
  // so we don't call `Date.now()` directly during render.
  const { d: daysAway } = useCountdown(deadline.getTime());

  // Fetch the authoritative user row so we can decide whether to show the
  // "set your display name" nudge (bell badge + sheet entry). Failures are
  // silent — the bell simply stays badge-less.
  useEffect(() => {
    if (!userId) return;
    const ctrl = new AbortController();
    getMe(ctrl.signal)
      .then(setMe)
      .catch(() => { /* keep me=null → no badge */ });
    return () => ctrl.abort();
  }, [userId]);

  useEffect(() => {
    const ctrl = new AbortController();
    apiFetch<{ gameweek: number; deadline: string }>('/gameweeks/current', { signal: ctrl.signal })
      .then((data: { gameweek: number; deadline: string }) => {
        setGameweek(data.gameweek);
        setDeadline(new Date(data.deadline));
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(GW_KEY, String(data.gameweek));
        }
      })
      .catch(() => {/* keep fallbacks */ });
    return () => ctrl.abort();
  }, []);


  // Resolve the user's own standings (season pts, GW pts, rank) from the
  // leaderboard. Same source as the Leaderboard screen, so numbers agree.
  useEffect(() => {
    if (!userId) return;
    const ctrl = new AbortController();
    const resolveAndLoad = async () => {
      const data = await apiFetch<{ total?: number; leaderboard?: Array<{ rank?: number; user_id?: string; total_points?: number; gw_points?: number }> }>('/leaderboard?limit=100', { signal: ctrl.signal });
      const rows = data.leaderboard ?? [];
      const mine = rows.find(row => row.user_id === userId);
      if (mine) {
        setStats({
          seasonPts: Number(mine.total_points ?? 0),
          gwPts: Number(mine.gw_points ?? 0),
          rank: Number(mine.rank ?? 0),
          total: Number(data.total ?? rows.length),
        });
        return;
      }

      // Fallback: if row not yet visible in leaderboard but squad exists,
      // derive non-rank stats from squad points so Home cards don't show dashes.
      if (typeof window !== 'undefined') {
        const squadId = window.localStorage.getItem(SQUAD_ID_KEY);
        if (!squadId) return;
        const squadData = await apiFetch<{ total_points?: number }>(`/squads/${squadId}/points`, { signal: ctrl.signal });
        const totalPoints = Number(squadData.total_points ?? 0);
        setStats({
          seasonPts: totalPoints,
          gwPts: totalPoints,
          rank: 0,
          total: Number(data.total ?? rows.length),
        });
      }
    };
    resolveAndLoad().catch(() => {/* keep null → cards show placeholders */ });
    return () => ctrl.abort();
  }, [userId]);

  const handleTabChange = (id: string) => {
    if (id === 'squad') { onNavigate('squad'); return; }
    if (id === 'leaderboard') { onNavigate('leaderboard'); return; }
    if (id === 'profile') { onNavigate('profile'); return; }
    setActiveTab(id);
  };

  // Single-entry notifications list. The only nudge today is "set your
  // display name" — surfaced when the backend says the user has not yet
  // customised their auto-derived username.
  const notifications = useMemo<NotificationItem[]>(() => {
    if (!me || me.username_customized) return [];
    return [{
      icon: <span aria-hidden="true">👕</span>,
      title: 'Set your display name',
      subtitle: 'Pick how you appear on the leaderboard',
      onTap: () => { setNotificationsOpen(false); onNavigate('profile'); },
    }];
  }, [me, onNavigate]);

  const showBellBadge = notifications.length > 0;

  const hasSquad = typeof window !== 'undefined' && window.localStorage.getItem(SQUAD_DATA_KEY) !== null;

  return (
    <ScreenShell
      background={HM.bg2}
      color={HM.text}
      header={(
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
            <BrandMark size={22} />
            <div>
              <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 18, letterSpacing: '-0.01em', lineHeight: 1 }}>Campus Gaffer</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.22em', color: HM.accent, textTransform: 'uppercase', fontWeight: 600, marginTop: 2 }}>Intramural · Fantasy</div>
            </div>
          </div>
          <button
            type="button"
            aria-label="Notifications"
            onClick={() => setNotificationsOpen(true)}
            style={{ width: 36, height: 36, borderRadius: '50%', border: `1px solid ${HM.line}`, background: 'rgba(255,255,255,0.03)', color: HM.textDim, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0, position: 'relative' }}
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 2a5 5 0 0 0-5 5v3l-1 2h12l-1-2V7a5 5 0 0 0-5-5Z" stroke="currentColor" strokeWidth="1.4" fill="none" />
              <path d="M6.5 13.5a1.5 1.5 0 0 0 3 0" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            {showBellBadge && (
              <div style={{ position: 'absolute', top: 7, right: 7, width: 7, height: 7, borderRadius: '50%', background: HM.accent, border: `2px solid ${HM.bg2}` }} />
            )}
          </button>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(130,200,130,0.18)', border: `1.5px solid rgba(130,200,130,0.45)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 15, color: HM.accent, cursor: 'pointer' }}>Y</div>
        </div>
      )}
      footer={<TabBar active={activeTab} onChange={handleTabChange} />}
    >
      <div style={{ minHeight: '100%', display: 'flex', flexDirection: 'column' }}>
        {activeTab === 'home' ? (
          <>
            <div style={{ padding: '6px 18px 20px' }}>
              <div id='greeting' style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 24, letterSpacing: '-0.02em', lineHeight: 1.1, color: HM.text }}>
                Good morning,<br />
                <span style={{ color: HM.accent }}>Gaffer.</span>
              </div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: '0.12em', color: HM.textFaint, textTransform: 'uppercase', marginTop: 6 }}>
                Gameweek {gameweek} complete · GW{gameweek + 1} open
              </div>
            </div>

            {/* Deadline strip */}
            <div style={{ margin: '0 16px 16px', background: HM.warnDim, border: `1px solid oklch(0.78 0.16 60 / 0.3)`, borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: HM.warn, flexShrink: 0, animation: 'hm-pulse 1.8s ease-in-out infinite' }} />
              <div>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.14em', color: HM.warn, textTransform: 'uppercase', fontWeight: 700 }}>GW{gameweek + 1} Deadline</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.10em', color: 'rgba(255,255,255,0.7)', marginLeft: 10 }}>{formatDeadlineLabel(deadline)}</span>
              </div>
              <div style={{ flex: 1 }} />
              <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 13, color: HM.warn, fontVariantNumeric: 'tabular-nums' }}>
                {daysAway}d away
              </span>
            </div>

            {/* 2×2 grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '0 16px' }}>
              <MySquadCard onNav={() => onNavigate('squad')} gameweek={gameweek} stats={stats} />
              <LeaderboardCard onNav={() => onNavigate('leaderboard')} stats={stats} />
              <DeadlineCard gameweek={gameweek} deadline={deadline} />
              <ResultsCard onNav={() => onNavigate('breakdown')} gameweek={gameweek} />
            </div>

            {/* Quick action */}
            <div style={{ margin: '16px 16px 0', padding: '12px 16px', background: HM.card, border: `1px solid ${HM.lineDim}`, borderRadius: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 14, color: HM.text, letterSpacing: '-0.01em' }}>View points breakdown</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: '0.10em', color: HM.textFaint, textTransform: 'uppercase', marginTop: 2 }}>{hasSquad ? (stats ? `GW${gameweek} · ${stats.gwPts} pts scored` : `GW${gameweek}`) : 'No squad yet'}</div>
              </div>
              <button type="button" onClick={() => onNavigate('breakdown')} style={{ height: 34, padding: '0 14px', borderRadius: 10, border: `1px solid ${HM.accent}`, background: withAlpha(HM.accent, 0.12), color: HM.accent, fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                See breakdown
              </button>
            </div>
          </>
        ) : (
          <ProfileView />
        )}
      </div>
      <NotificationsSheet
        notifications={notifications}
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />
    </ScreenShell>
  );
}

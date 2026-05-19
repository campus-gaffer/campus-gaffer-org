import { useState, useEffect, useRef, useMemo, useCallback } from 'react';

// ─── Palette ───────────────────────────────────────────────────────────────
const PAL = {
  bg: 'oklch(0.13 0.025 248)', bg2: 'oklch(0.10 0.02 248)',
  card: 'oklch(0.17 0.03 248)', line: 'oklch(0.28 0.04 248)',
  lineDim: 'oklch(0.22 0.03 248)',
  accent: 'oklch(0.82 0.19 142)', accentBg: 'oklch(0.82 0.19 142 / 0.13)',
  accentBorder: 'oklch(0.82 0.19 142 / 0.40)', accentInk: 'oklch(0.18 0.04 142)',
  text: '#fff', textDim: 'rgba(235,235,245,0.65)', textFaint: 'rgba(235,235,245,0.42)',
  gold: 'oklch(0.85 0.18 85)', silver: 'oklch(0.82 0.04 240)', bronze: 'oklch(0.75 0.14 55)',
};

const AV_COLORS = [
  'oklch(0.70 0.16 25)', 'oklch(0.60 0.14 260)', 'oklch(0.78 0.15 80)',
  'oklch(0.70 0.15 340)', 'oklch(0.70 0.12 195)', 'oklch(0.72 0.16 50)',
  'oklch(0.70 0.15 305)', 'oklch(0.72 0.14 150)',
];

const withAlpha = (color: string, alpha: number) => color.replace(')', ` / ${alpha})`);

const MEDAL_COLORS = {
  gold:   { color: PAL.gold,   lighter: 'oklch(0.93 0.14 85)'  },
  silver: { color: PAL.silver, lighter: 'oklch(0.90 0.04 240)' },
  bronze: { color: PAL.bronze, lighter: 'oklch(0.83 0.11 55)'  },
};

const CURRENT_USER_ID = 12;
const GAMEWEEK = 7;
const PAGE_SIZE = 20;

interface LBUser {
  id: number; rank: number; name: string; isMe: boolean;
  seasonPts: number; gwPts: number; avColor: string; initial: string;
}

function makeUsers(): LBUser[] {
  const names = [
    'AlphaGaffer','PitchKing','GoalMachine','SquadWiz','TacticBoss',
    'NetBuster','TopStriker','FantasyAce','DeepRun','SetPiece',
    'WingPlay','You','DeadBall','FullPress','HighLine',
    'OffsideTrap','FreeKick','PenaltyBox','DriveShot','Nutmeg',
    'CrossField','Volley','ChestControl','CruyffTurn','ElasticoFC',
    'ScissorKick','RabonaShot','DipperShot','BicycleKick','ToeBlast',
    'PowerHeader','GloveSave','CornerKing','ThrowIn','GoalLine',
    'MidfieldMaestro','HoldingMid','SweepKeeper','WingBack','TargetMan',
  ];
  const gwPts = [42,38,36,34,31,30,28,27,26,24,22,37,20,19,17,16,15,14,13,12,
                 11,10,9,8,7,6,6,5,5,4,4,3,3,2,2,2,2,1,1,1];
  const seasonPts: number[] = [];
  let cur = 228;
  for (let i = 0; i < 40; i++) {
    seasonPts.push(cur);
    cur -= (2 + (i % 3) + Math.floor(i / 8));
  }
  seasonPts[CURRENT_USER_ID - 1] = 142;
  gwPts[CURRENT_USER_ID - 1] = 37;
  return names.map((name, i) => ({
    id: i + 1, rank: i + 1, name, isMe: (i + 1) === CURRENT_USER_ID,
    seasonPts: seasonPts[i], gwPts: gwPts[i],
    avColor: AV_COLORS[i % AV_COLORS.length], initial: name.charAt(0).toUpperCase(),
  }));
}

const ALL_USERS = makeUsers();

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

function Medal({ color, lighter, label }: { color: string; lighter: string; label: string }) {
  return (
    <div style={{ width: 28, height: 28, borderRadius: '50%', background: `radial-gradient(circle at 35% 30%, ${lighter}, ${color})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 3px 10px -3px ${color}`, flexShrink: 0 }}>
      <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 12, color: 'rgba(0,0,0,0.65)' }}>{label}</span>
    </div>
  );
}

function RankBadge({ rank, isMe }: { rank: number; isMe: boolean }) {
  if (rank === 1) return <Medal color={MEDAL_COLORS.gold.color} lighter={MEDAL_COLORS.gold.lighter} label="1" />;
  if (rank === 2) return <Medal color={MEDAL_COLORS.silver.color} lighter={MEDAL_COLORS.silver.lighter} label="2" />;
  if (rank === 3) return <Medal color={MEDAL_COLORS.bronze.color} lighter={MEDAL_COLORS.bronze.lighter} label="3" />;
  return (
    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: rank > 99 ? 11 : 13, color: isMe ? PAL.accent : PAL.textFaint, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums', minWidth: 28, textAlign: 'center', display: 'block' }}>
      {rank}
    </span>
  );
}

function Avatar({ user, size = 36, isMe }: { user: LBUser; size?: number; isMe: boolean }) {
  const color = isMe ? PAL.accent : user.avColor;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: withAlpha(color, isMe ? 0.22 : 0.18), color: isMe ? PAL.accent : color, border: `1.5px solid ${withAlpha(color, isMe ? 0.55 : 0.40)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: Math.floor(size * 0.42), boxShadow: isMe ? `0 0 0 3px ${withAlpha(PAL.accent, 0.18)}` : 'none' }}>
      {user.initial}
    </div>
  );
}

function LBRow({ user, sort, isFirst, animDelay }: { user: LBUser; sort: string; isFirst: boolean; animDelay: number }) {
  const isMe = user.isMe;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '40px 40px 1fr 58px 58px', alignItems: 'center', height: isMe ? 60 : 54, padding: '0 14px', gap: 0, position: 'relative', background: isMe ? PAL.accentBg : 'transparent', borderTop: isFirst ? 'none' : `1px solid ${isMe ? PAL.accentBorder : PAL.lineDim}`, borderBottom: isMe ? `1px solid ${PAL.accentBorder}` : 'none', borderLeft: isMe ? `3px solid ${PAL.accent}` : '3px solid transparent', animation: `lb-rise 280ms cubic-bezier(.2,.6,.2,1) ${animDelay}ms both`, transition: 'background 160ms' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <RankBadge rank={user.rank} isMe={isMe} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Avatar user={user} size={34} isMe={isMe} />
      </div>
      <div style={{ paddingLeft: 10, minWidth: 0 }}>
        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: isMe ? 700 : 600, fontSize: 14.5, color: isMe ? PAL.accent : PAL.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>
          {user.name}
          {isMe && <span style={{ marginLeft: 7, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.16em', color: PAL.accent, opacity: 0.85, textTransform: 'uppercase', fontWeight: 600 }}>YOU</span>}
        </div>
        {sort === 'gw' && (
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: '0.10em', color: PAL.textFaint, marginTop: 1 }}>{user.seasonPts} total</div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingRight: 6 }}>
        <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: sort === 'gw' ? 800 : 500, fontSize: sort === 'gw' ? 17 : 14, color: sort === 'gw' ? (isMe ? PAL.accent : user.gwPts >= 30 ? PAL.accent : PAL.text) : PAL.textDim, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{user.gwPts}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8.5, letterSpacing: '0.12em', color: PAL.textFaint, textTransform: 'uppercase' }}>gw</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingRight: 4 }}>
        <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: sort === 'season' ? 800 : 500, fontSize: sort === 'season' ? 17 : 14, color: sort === 'season' ? (isMe ? PAL.accent : PAL.text) : PAL.textDim, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{user.seasonPts}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8.5, letterSpacing: '0.12em', color: PAL.textFaint, textTransform: 'uppercase' }}>pts</span>
      </div>
    </div>
  );
}

function ColStrip({ sort, setSort }: { sort: string; setSort: (s: string) => void }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '40px 40px 1fr 58px 58px', alignItems: 'center', height: 32, padding: '0 14px', gap: 0, borderBottom: `1px solid ${PAL.lineDim}`, background: PAL.bg, position: 'sticky', top: 0, zIndex: 3 }}>
      <div /><div />
      <span style={{ paddingLeft: 10, fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: '0.18em', color: PAL.textFaint, textTransform: 'uppercase' }}>Player</span>
      {[{ id: 'gw', label: `GW${GAMEWEEK}` }, { id: 'season', label: 'Total' }].map(({ id, label }) => {
        const active = sort === id;
        return (
          <button key={id} type="button" onClick={() => setSort(id)} style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingRight: id === 'gw' ? 6 : 4, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: active ? PAL.accent : PAL.textFaint, fontWeight: active ? 700 : 500, display: 'flex', alignItems: 'center', gap: 3, paddingRight: id === 'gw' ? 6 : 4 }}>
              {active && <svg width="7" height="7" viewBox="0 0 7 7" fill={PAL.accent}><polygon points="3.5,1 6,5.5 1,5.5" /></svg>}
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PodiumCard({ users }: { users: LBUser[] }) {
  const [first, second, third] = users;
  const podium = [second, first, third];
  const heights = [72, 92, 56];
  const medals = [MEDAL_COLORS.silver, MEDAL_COLORS.gold, MEDAL_COLORS.bronze];
  const labels = ['2nd', '1st', '3rd'];
  return (
    <div style={{ margin: '4px 16px 12px', background: PAL.card, border: `1px solid ${PAL.lineDim}`, borderRadius: 18, padding: '16px 12px 12px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)', width: 200, height: 160, borderRadius: '50%', background: `radial-gradient(circle, ${withAlpha(PAL.gold, 0.13)}, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.22em', color: PAL.accent, textTransform: 'uppercase', fontWeight: 700, textAlign: 'center', marginBottom: 16 }}>
        GW{GAMEWEEK} Podium
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8 }}>
        {podium.map((user, i) => (
          <div key={user.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            {user.isMe && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8.5, letterSpacing: '0.18em', color: PAL.accent, textTransform: 'uppercase', marginBottom: 4, fontWeight: 700 }}>YOU</span>}
            <Avatar user={user} size={38} isMe={user.isMe} />
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 11.5, color: user.isMe ? PAL.accent : PAL.textDim, letterSpacing: '-0.01em', marginTop: 6, maxWidth: 80, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: '0.06em', color: PAL.textFaint, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{user.seasonPts} pts</div>
            <div style={{ marginTop: 8, width: '100%', height: heights[i], background: `radial-gradient(circle at 50% 0%, ${withAlpha(medals[i].color, 0.22)}, ${withAlpha(medals[i].color, 0.06)})`, border: `1px solid ${withAlpha(medals[i].color, 0.22)}`, borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 8 }}>
              <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 16, color: medals[i].color }}>{labels[i]}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StickyMeBanner({ user, sort, visible }: { user: LBUser; sort: string; visible: boolean }) {
  if (!visible) return null;
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 40, zIndex: 8, padding: '0 16px', animation: 'lb-rise 220ms ease both' }}>
      <div style={{ background: 'oklch(0.18 0.12 142)', border: `1px solid ${PAL.accentBorder}`, borderRadius: 14, padding: '0 14px', display: 'grid', gridTemplateColumns: '40px 40px 1fr 58px 58px', alignItems: 'center', height: 54, gap: 0, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: `0 8px 24px -8px ${withAlpha(PAL.accent, 0.35)}` }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}><RankBadge rank={user.rank} isMe /></div>
        <div style={{ display: 'flex', justifyContent: 'center' }}><Avatar user={user} size={32} isMe /></div>
        <div style={{ paddingLeft: 10 }}>
          <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 14, color: PAL.accent, letterSpacing: '-0.01em' }}>
            You <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.16em', opacity: 0.75 }}>· #{user.rank}</span>
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingRight: 6 }}>
          <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: sort === 'gw' ? 800 : 500, fontSize: sort === 'gw' ? 17 : 14, color: sort === 'gw' ? PAL.accent : PAL.textDim, fontVariantNumeric: 'tabular-nums' }}>{user.gwPts}</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8.5, color: PAL.textFaint, textTransform: 'uppercase', letterSpacing: '0.12em' }}>gw</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingRight: 4 }}>
          <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: sort === 'season' ? 800 : 500, fontSize: sort === 'season' ? 17 : 14, color: sort === 'season' ? PAL.accent : PAL.textDim, fontVariantNumeric: 'tabular-nums' }}>{user.seasonPts}</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8.5, color: PAL.textFaint, textTransform: 'uppercase', letterSpacing: '0.12em' }}>pts</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────
export default function LeaderboardScreen({ onBack }: { onBack: () => void }) {
  const [sort, setSort] = useState('season');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [meVisible, setMeVisible] = useState(true);
  const meRowRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sorted = useMemo(() => {
    const key = sort === 'gw' ? 'gwPts' : 'seasonPts';
    return [...ALL_USERS]
      .sort((a, b) => b[key] - a[key])
      .map((u, i) => ({ ...u, rank: i + 1 }));
  }, [sort]);

  const visible = sorted.slice(0, visibleCount);
  const me = sorted.find(u => u.isMe)!;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => {
      const meEl = meRowRef.current;
      if (!meEl) { setMeVisible(false); return; }
      const scrollTop = el.scrollTop;
      const scrollBot = scrollTop + el.clientHeight;
      const rowTop = meEl.offsetTop;
      const rowBot = rowTop + meEl.offsetHeight;
      setMeVisible(rowBot < scrollTop || rowTop > scrollBot);
    };
    el.addEventListener('scroll', check, { passive: true });
    return () => el.removeEventListener('scroll', check);
  }, [visibleCount, sort]);

  const loadMore = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setVisibleCount(c => Math.min(c + PAGE_SIZE, ALL_USERS.length));
      setLoading(false);
    }, 600);
  }, []);

  const hasMore = visibleCount < ALL_USERS.length;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: PAL.bg2, color: PAL.text, fontFamily: "'DM Sans', sans-serif", overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '6px 18px 8px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, background: PAL.bg2, zIndex: 4 }}>
        <button type="button" aria-label="Back" onClick={onBack} style={{ width: 34, height: 34, borderRadius: '50%', border: `1px solid ${PAL.line}`, background: 'rgba(255,255,255,0.03)', color: PAL.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <BallMark size={15} />
            <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em' }}>Leaderboard</span>
          </div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: '0.20em', color: PAL.accent, textTransform: 'uppercase', fontWeight: 600, marginTop: 2 }}>Gameweek {GAMEWEEK}</span>
        </div>
        <button type="button" aria-label="Filter" style={{ width: 34, height: 34, borderRadius: '50%', border: `1px solid ${PAL.line}`, background: 'rgba(255,255,255,0.03)', color: PAL.textDim, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3" />
            <path d="M4 5h6M5 7h4M6 9h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Scrollable body */}
      <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 44 }}>
        <PodiumCard users={sorted.slice(0, 3)} />

        {/* Stats strip */}
        <div style={{ margin: '0 16px 10px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: PAL.card, border: `1px solid ${PAL.lineDim}`, borderRadius: 14, padding: '12px 14px' }}>
          {[
            { label: 'Players', value: ALL_USERS.length },
            { label: 'Your rank', value: `#${me?.rank}` },
            { label: 'Avg pts', value: Math.round(sorted.reduce((s, u) => s + u.seasonPts, 0) / sorted.length) },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: '0.16em', color: PAL.textFaint, textTransform: 'uppercase' }}>{label}</span>
              <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em', color: label === 'Your rank' ? PAL.accent : PAL.text, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ margin: '0 16px' }}>
          <ColStrip sort={sort} setSort={setSort} />
          <div>
            {visible.map((user, i) => (
              <div key={`${user.id}-${sort}`} ref={user.isMe ? meRowRef : null}>
                <LBRow user={user} sort={sort} isFirst={i === 0} animDelay={Math.min(i * 22, 300)} />
              </div>
            ))}
          </div>

          {hasMore ? (
            <button type="button" onClick={loadMore} disabled={loading} style={{ width: '100%', height: 48, marginTop: 10, borderRadius: 12, border: `1px solid ${PAL.line}`, background: 'transparent', color: loading ? PAL.textFaint : PAL.textDim, fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 14, letterSpacing: '0.01em', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 160ms' }}>
              {loading ? (
                <>
                  <svg width="16" height="16" viewBox="0 0 16 16" style={{ animation: 'lb-spin 700ms linear infinite' }}>
                    <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeOpacity="0.3" strokeWidth="2" />
                    <path d="M8 2a6 6 0 0 1 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" fill="none" />
                  </svg>
                  Loading…
                </>
              ) : (
                <>
                  Load {Math.min(PAGE_SIZE, ALL_USERS.length - visibleCount)} more
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.10em', color: PAL.textFaint }}>
                    · {ALL_USERS.length - visibleCount} remaining
                  </span>
                </>
              )}
            </button>
          ) : (
            <div style={{ textAlign: 'center', padding: '14px 0 0', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.16em', color: PAL.textFaint, textTransform: 'uppercase' }}>
              All {ALL_USERS.length} players shown
            </div>
          )}
        </div>
      </div>

      <StickyMeBanner user={me} sort={sort} visible={meVisible} />
    </div>
  );
}

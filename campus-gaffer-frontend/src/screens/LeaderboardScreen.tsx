import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { SQUAD_DATA_KEY, GW_KEY, USER_ID_KEY, SQUAD_ID_KEY } from '../lib/mockSquad';
import { BrandMark } from '../components/BrandMark';
import './screen-shared.css';
import LBRow, { Avatar } from '../components/leaderboard/LBRow';
import StickyMeBanner from '../components/leaderboard/StickyMeBanner';
import { AV_COLORS, PAGE_SIZE, MEDAL_COLORS } from '../lib/leaderboardTheme';
import { THEME, withAlpha } from '../lib/theme';
import type { LBUser } from '../lib/leaderboardTheme';
import { apiFetch } from '../lib/api';


function ColStrip({ sort, setSort, gameweek, gwReady }: { sort: string; setSort: (s: string) => void; gameweek: number; gwReady: boolean }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'clamp(30px,9vw,40px) clamp(30px,9vw,40px) 1fr minmax(48px,58px) minmax(48px,58px)', alignItems: 'center', height: 32, padding: '0 14px', gap: 0, borderBottom: `1px solid ${THEME.lineDim}`, background: THEME.bg, position: 'sticky', top: 0, zIndex: 3 }}>
      <div /><div />
      <span style={{ paddingLeft: 10, fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: '0.18em', color: THEME.textFaint, textTransform: 'uppercase' }}>Player</span>
      {[{ id: 'gw', label: `GW${gameweek}` }, { id: 'season', label: 'Total' }].map(({ id, label }) => {
        const active = sort === id;
        const disabled = id === 'gw' && !gwReady;
        return (
          <button
            key={id}
            type="button"
            onClick={() => !disabled && setSort(id)}
            title={disabled ? 'Per-GW points coming soon' : undefined}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingRight: id === 'gw' ? 6 : 4, background: 'transparent', border: 'none', cursor: disabled ? 'default' : 'pointer', padding: 0, opacity: disabled ? 0.35 : 1 }}
          >
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: '0.16em', textTransform: 'uppercase', color: active ? THEME.accent : THEME.textFaint, fontWeight: active ? 700 : 500, display: 'flex', alignItems: 'center', gap: 3, paddingRight: id === 'gw' ? 6 : 4 }}>
              {active && <svg width="7" height="7" viewBox="0 0 7 7" fill={THEME.accent}><polygon points="3.5,1 6,5.5 1,5.5" /></svg>}
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

function PodiumCard({ users, gameweek }: { users: LBUser[]; gameweek: number }) {
  const [first, second, third] = users;
  const podium = [second, first, third];
  const heights = [72, 92, 56];
  const medals = [MEDAL_COLORS.silver, MEDAL_COLORS.gold, MEDAL_COLORS.bronze];
  const labels = ['2nd', '1st', '3rd'];
  return (
    <div style={{ margin: '4px 16px 12px', background: THEME.card, border: `1px solid ${THEME.lineDim}`, borderRadius: 18, padding: '16px 12px 12px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -40, left: '50%', transform: 'translateX(-50%)', width: 200, height: 160, borderRadius: '50%', background: `radial-gradient(circle, ${withAlpha(THEME.gold, 0.13)}, transparent 70%)`, pointerEvents: 'none' }} />
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.22em', color: THEME.accent, textTransform: 'uppercase', fontWeight: 700, textAlign: 'center', marginBottom: 16 }}>
        GW{gameweek} Podium
      </div>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 8 }}>
        {podium.map((user, i) => (
          <div key={user.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            {user.isMe && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8.5, letterSpacing: '0.18em', color: THEME.accent, textTransform: 'uppercase', marginBottom: 4, fontWeight: 700 }}>YOU</span>}
            <Avatar user={user} size={38} isMe={user.isMe} />
            <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 11.5, color: user.isMe ? THEME.accent : THEME.textDim, letterSpacing: '-0.01em', marginTop: 6, maxWidth: 80, textAlign: 'center', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: '0.06em', color: THEME.textFaint, marginTop: 2, fontVariantNumeric: 'tabular-nums' }}>{user.seasonPts} pts</div>
            <div style={{ marginTop: 8, width: '100%', height: heights[i], background: `radial-gradient(circle at 50% 0%, ${withAlpha(medals[i].color, 0.22)}, ${withAlpha(medals[i].color, 0.06)})`, border: `1px solid ${withAlpha(medals[i].color, 0.22)}`, borderRadius: '8px 8px 0 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: 8 }}>
              <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 16, color: medals[i].color }}>{labels[i]}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}



// ─── Main ──────────────────────────────────────────────────────────────────
export default function LeaderboardScreen({ onBack }: { onBack: () => void }) {
  const hasSquad = typeof window !== 'undefined' && window.localStorage.getItem(SQUAD_DATA_KEY) !== null;
  const [currentGW] = useState(() => {
    if (typeof window === 'undefined') return 7;
    const stored = window.localStorage.getItem(GW_KEY);
    return stored ? parseInt(stored, 10) : 7;
  });
  // The current user's ID — set when they create a squad (POST /squads). Used to
  // flag their own row on the leaderboard. Falls back to the env placeholder.
  const [currentUserId, setCurrentUserId] = useState(() => {
    if (typeof window !== 'undefined') {
      const local = window.localStorage.getItem(USER_ID_KEY);
      if (local) return local;
    }
    return String(import.meta.env.VITE_CURRENT_USER_ID || '');
  });
  const [sort, setSort] = useState('season');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<LBUser[]>([]);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isMeRowOutsideViewport, setIsMeRowOutsideViewport] = useState(true);
  const meRowRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<HTMLButtonElement | null>(null);
  const [isLoadMoreVisible, setIsLoadMoreVisible] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (currentUserId) return;
    const squadId = window.localStorage.getItem(SQUAD_ID_KEY);
    if (!squadId) return;
    const controller = new AbortController();
    apiFetch<{ squad?: { UserID?: string; user_id?: string } }>(`/squads/${squadId}`, { signal: controller.signal })
      .then((payload: { squad?: { UserID?: string; user_id?: string } }) => {
        const resolved = payload.squad?.UserID ?? payload.squad?.user_id ?? '';
        if (!resolved) return;
        window.localStorage.setItem(USER_ID_KEY, resolved);
        setCurrentUserId(resolved);
      })
      .catch(() => {/* no-op */});
    return () => controller.abort();
  }, [currentUserId]);

  useEffect(() => {
    if (!hasSquad) {
      // show current user as unranked (0 points) when no squad exists
      setUsers((prev) => prev.map(u => u.isMe ? { ...u, seasonPts: 0, gwPts: 0 } : u));
    }

    const controller = new AbortController();
    const loadLeaderboard = async () => {
      try {
        setApiError(null);
        const data = await apiFetch<{ leaderboard?: Array<{ rank?: number; user_id?: string; username?: string; total_points?: number; gw_points?: number }> }>('/leaderboard?limit=100&offset=0', { signal: controller.signal });
        const rows = data.leaderboard ?? [];
        if (rows.length === 0) return;
        const mapped: LBUser[] = rows.map((row, i) => {
          const uid = row.user_id ?? String(i + 1);
          const rawName = row.username?.trim() ?? '';
          // Treat purely-numeric usernames (old int-ID test users) as unnamed.
          const display = rawName && !/^\d+$/.test(rawName) ? rawName : `User ${parseInt(uid, 10) || i + 1}`;
          return {
            id: uid,
            rank: Number(row.rank ?? i + 1),
            name: display,
            isMe: currentUserId !== '' && uid === currentUserId,
            seasonPts: Number(row.total_points ?? 0),
            gwPts: Number(row.gw_points ?? 0),
            avColor: AV_COLORS[i % AV_COLORS.length],
            initial: display.charAt(0).toUpperCase(),
          };
        });
        setUsers(mapped);
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        setApiError('Live leaderboard unavailable — check your connection to the server');
      }
    };
    loadLeaderboard();
    return () => controller.abort();
  }, [hasSquad, currentUserId]);

  const sorted = useMemo(() => {
    const key = sort === 'gw' ? 'gwPts' : 'seasonPts';
    return [...users]
      .sort((a, b) => b[key] - a[key])
      .map((u, i) => ({ ...u, rank: i + 1 }));
  }, [sort, users]);

  const visible = sorted.slice(0, visibleCount);
  const me = sorted.find(u => u.isMe); // undefined when current manager row not present
  const meInVisiblePage = me ? me.rank <= visibleCount : false;

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const check = () => {
      const meEl = meRowRef.current;
      const loadEl = loadMoreRef.current;
      // Keep sticky "You" row visible until your rank is within the loaded page.
      if (!meInVisiblePage || !meEl) {
        // Still compute load-more visibility so we can hide the banner when the button shows
        if (loadEl) {
          const containerRect = el.getBoundingClientRect();
          const loadRect = loadEl.getBoundingClientRect();
          const topBound = containerRect.top + 32;
          const bottomBound = containerRect.bottom - 8;
          const loadIntersects = loadRect.bottom > topBound && loadRect.top < bottomBound;
          setIsLoadMoreVisible(loadIntersects);
        }
        setIsMeRowOutsideViewport(true);
        return;
      }

      const containerRect = el.getBoundingClientRect();
      const rowRect = meEl.getBoundingClientRect();
      const topBound = containerRect.top + 32; // sticky column header height
      const bottomBound = containerRect.bottom - 8;
      const intersectsViewport = rowRect.bottom > topBound && rowRect.top < bottomBound;

      // Also compute load-more visibility so banner can hide when button is available
      if (loadEl) {
        const loadRect = loadEl.getBoundingClientRect();
        const loadIntersects = loadRect.bottom > topBound && loadRect.top < bottomBound;
        setIsLoadMoreVisible(loadIntersects);
      } else {
        setIsLoadMoreVisible(false);
      }

      setIsMeRowOutsideViewport(!intersectsViewport);
    };

    check();
    el.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      el.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, [visibleCount, sort, meInVisiblePage]);

  const loadMore = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setVisibleCount(c => Math.min(c + PAGE_SIZE, users.length));
      setLoading(false);
    }, 600);
  }, [users.length]);

  const hasMore = visibleCount < users.length;

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: THEME.bg2, color: THEME.text, fontFamily: "'DM Sans', sans-serif", overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <div style={{ padding: '6px 18px 8px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, background: THEME.bg2, zIndex: 4 }}>
        <button type="button" aria-label="Back" onClick={onBack} style={{ width: 34, height: 34, borderRadius: '50%', border: `1px solid ${THEME.line}`, background: 'rgba(255,255,255,0.03)', color: THEME.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <BrandMark size={15} />
            <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em' }}>Leaderboard</span>
          </div>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: '0.20em', color: THEME.accent, textTransform: 'uppercase', fontWeight: 600, marginTop: 2 }}>Gameweek {currentGW}</span>
        </div>
        <button type="button" aria-label="Filter" style={{ width: 34, height: 34, borderRadius: '50%', border: `1px solid ${THEME.line}`, background: 'rgba(255,255,255,0.03)', color: THEME.textDim, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.3" />
            <path d="M4 5h6M5 7h4M6 9h2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {/* Scrollable body */}
      <div ref={scrollRef} style={{ flex: 1, minHeight: 0, overflowY: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 44 }}>
        {sorted.length >= 3 && <PodiumCard users={sorted.slice(0, 3)} gameweek={currentGW} />}
        {!hasSquad && (
          <div style={{ margin: '10px 16px', padding: '10px', borderRadius: 10, border: `1px solid ${THEME.lineDim}`, background: THEME.card, color: THEME.textFaint, fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
            You are currently <strong>Unranked</strong>. Create a squad to appear on the leaderboard.
          </div>
        )}
        {apiError && (
          <div style={{ margin: '0 16px 10px', padding: '8px 10px', borderRadius: 10, border: `1px solid ${THEME.lineDim}`, background: THEME.card, color: THEME.textFaint, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.08em' }}>
            {apiError}
          </div>
        )}

        {/* Stats strip */}
        <div style={{ margin: '0 16px 10px', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', background: THEME.card, border: `1px solid ${THEME.lineDim}`, borderRadius: 14, padding: '12px 14px' }}>
          {[
            { label: 'Players', value: users.length },
            { label: 'Your rank', value: me ? `#${me.rank}` : '—' },
            { label: 'Avg pts', value: sorted.length ? Math.round(sorted.reduce((s, u) => s + u.seasonPts, 0) / sorted.length) : 0 },
          ].map(({ label, value }) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: '0.16em', color: THEME.textFaint, textTransform: 'uppercase' }}>{label}</span>
              <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 18, letterSpacing: '-0.02em', color: label === 'Your rank' ? THEME.accent : THEME.text, fontVariantNumeric: 'tabular-nums' }}>{value}</span>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ margin: '0 16px' }}>
          <ColStrip sort={sort} setSort={setSort} gameweek={currentGW} gwReady={true} />
            <div>
              {visible.map((user, i) => (
                <div key={`${user.id}-${sort}`} ref={user.isMe ? meRowRef : null}>
                  <LBRow user={user} sort={sort} isFirst={i === 0} animDelay={Math.min(i * 22, 300)} />
                </div>
              ))}
            </div>

          {hasMore ? (
            <button ref={loadMoreRef} type="button" onClick={loadMore} disabled={loading} style={{ width: '100%', height: 48, marginTop: 10, borderRadius: 12, border: `1px solid ${THEME.line}`, background: 'transparent', color: loading ? THEME.textFaint : THEME.textDim, fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 600, fontSize: 14, letterSpacing: '0.01em', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 160ms' }}>
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
                  Load {Math.min(PAGE_SIZE, users.length - visibleCount)} more
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.10em', color: THEME.textFaint }}>
                    · {users.length - visibleCount} remaining
                  </span>
                </>
              )}
            </button>
          ) : (
            <div style={{ textAlign: 'center', padding: '14px 0 0', fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.16em', color: THEME.textFaint, textTransform: 'uppercase' }}>
              All {users.length} players shown
            </div>
          )}
        </div>
      </div>

      {me && <StickyMeBanner user={me} sort={sort} visible={!meInVisiblePage && isMeRowOutsideViewport && !isLoadMoreVisible} />}
    </div>
  );
}

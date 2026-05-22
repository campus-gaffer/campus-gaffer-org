import { THEME, withAlpha } from '../../lib/theme';
import { MEDAL_COLORS } from '../../lib/leaderboardTheme';

export type LBUser = {
  id: number; rank: number; name: string; isMe: boolean;
  seasonPts: number; gwPts: number; avColor: string; initial: string;
};

export function Medal({ color, lighter, label }: { color: string; lighter: string; label: string }) {
  return (
    <div style={{ width: 28, height: 28, borderRadius: '50%', background: `radial-gradient(circle at 35% 30%, ${lighter}, ${color})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 3px 10px -3px ${color}`, flexShrink: 0 }}>
      <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 12, color: 'rgba(0,0,0,0.65)' }}>{label}</span>
    </div>
  );
}

export function RankBadge({ rank, isMe }: { rank: number; isMe: boolean }) {
  if (rank === 1) return <Medal color={MEDAL_COLORS.gold.color} lighter={MEDAL_COLORS.gold.lighter} label="1" />;
  if (rank === 2) return <Medal color={MEDAL_COLORS.silver.color} lighter={MEDAL_COLORS.silver.lighter} label="2" />;
  if (rank === 3) return <Medal color={MEDAL_COLORS.bronze.color} lighter={MEDAL_COLORS.bronze.lighter} label="3" />;
  return (
    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: rank > 99 ? 11 : 13, color: isMe ? THEME.accent : THEME.textFaint, letterSpacing: '-0.01em', fontVariantNumeric: 'tabular-nums', minWidth: 28, textAlign: 'center', display: 'block' }}>
      {rank}
    </span>
  );
}

export function Avatar({ user, size = 36, isMe }: { user: LBUser; size?: number; isMe: boolean }) {
  const color = isMe ? THEME.accent : user.avColor;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', flexShrink: 0, background: withAlpha(color, isMe ? 0.22 : 0.18), color: isMe ? THEME.accent : color, border: `1.5px solid ${withAlpha(color, isMe ? 0.55 : 0.40)}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: Math.floor(size * 0.42), boxShadow: isMe ? `0 0 0 3px ${withAlpha(THEME.accent, 0.18)}` : 'none' }}>
      {user.initial}
    </div>
  );
}

export default function LBRow({ user, sort, isFirst, animDelay }: { user: LBUser; sort: string; isFirst: boolean; animDelay: number }) {
  const isMe = user.isMe;
  const accentBg = withAlpha(THEME.accent, 0.13);
  const accentBorder = withAlpha(THEME.accent, 0.40);
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'clamp(30px,9vw,40px) clamp(30px,9vw,40px) 1fr minmax(48px,58px) minmax(48px,58px)', alignItems: 'center', height: isMe ? 60 : 54, padding: '0 14px', gap: 0, position: 'relative', background: isMe ? accentBg : 'transparent', borderTop: isFirst ? 'none' : `1px solid ${isMe ? accentBorder : THEME.lineDim}`, borderBottom: isMe ? `1px solid ${accentBorder}` : 'none', borderLeft: isMe ? `3px solid ${THEME.accent}` : '3px solid transparent', animation: `lb-rise 280ms cubic-bezier(.2,.6,.2,1) ${animDelay}ms both`, transition: 'background 160ms' }}>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <RankBadge rank={user.rank} isMe={isMe} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <Avatar user={user} size={34} isMe={isMe} />
      </div>
      <div style={{ paddingLeft: 10, minWidth: 0 }}>
        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: isMe ? 700 : 600, fontSize: 14.5, color: isMe ? THEME.accent : THEME.text, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>
          {user.name}
          {isMe && <span style={{ marginLeft: 7, fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.16em', color: THEME.accent, opacity: 0.85, textTransform: 'uppercase', fontWeight: 600 }}>YOU</span>}
        </div>
        {sort === 'gw' && (
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: '0.10em', color: THEME.textFaint, marginTop: 1 }}>{user.seasonPts} total</div>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingRight: 6 }}>
        <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: sort === 'gw' ? 800 : 500, fontSize: sort === 'gw' ? 17 : 14, color: sort === 'gw' ? (isMe ? THEME.accent : user.gwPts >= 30 ? THEME.accent : THEME.text) : THEME.textDim, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{user.gwPts}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8.5, letterSpacing: '0.12em', color: THEME.textFaint, textTransform: 'uppercase' }}>gw</span>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingRight: 4 }}>
        <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: sort === 'season' ? 800 : 500, fontSize: sort === 'season' ? 17 : 14, color: sort === 'season' ? (isMe ? THEME.accent : THEME.text) : THEME.textDim, fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}>{user.seasonPts}</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8.5, letterSpacing: '0.12em', color: THEME.textFaint, textTransform: 'uppercase' }}>pts</span>
      </div>
    </div>
  );
}

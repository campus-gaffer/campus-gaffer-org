import { THEME, withAlpha } from '../../lib/theme';
import type { LBUser as LBUserType } from '../../lib/leaderboardTheme';
import { RankBadge, Avatar } from './LBRow';

export default function StickyMeBanner({ user, sort, visible }: { user: LBUserType; sort: string; visible: boolean }) {
  if (!visible) return null;
  const accentBorder = withAlpha(THEME.accent, 0.40);
  const bannerBg = 'oklch(0.18 0.12 142)';
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 40, zIndex: 8, padding: '0 16px', animation: 'lb-rise 220ms ease both' }}>
      <div style={{ background: bannerBg, border: `1px solid ${accentBorder}`, borderRadius: 14, padding: '0 14px', display: 'grid', gridTemplateColumns: 'clamp(30px,9vw,40px) clamp(30px,9vw,40px) 1fr minmax(48px,58px) minmax(48px,58px)', alignItems: 'center', height: 54, gap: 0, backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: `0 8px 24px -8px ${withAlpha(THEME.accent, 0.35)}` }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}><RankBadge rank={user.rank} isMe={user.isMe} /></div>
        <div style={{ display: 'flex', justifyContent: 'center' }}><Avatar user={user} size={32} isMe={user.isMe} /></div>
        <div style={{ paddingLeft: 10 }}>
          <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 14, color: THEME.accent, letterSpacing: '-0.01em' }}>
            You <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9, letterSpacing: '0.16em', opacity: 0.75 }}>· #{user.rank}</span>
          </span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingRight: 6 }}>
          <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: sort === 'gw' ? 800 : 500, fontSize: sort === 'gw' ? 17 : 14, color: sort === 'gw' ? THEME.accent : THEME.textDim, fontVariantNumeric: 'tabular-nums' }}>{user.gwPts}</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8.5, color: THEME.textFaint, textTransform: 'uppercase', letterSpacing: '0.12em' }}>gw</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', paddingRight: 4 }}>
          <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: sort === 'season' ? 800 : 500, fontSize: sort === 'season' ? 17 : 14, color: sort === 'season' ? THEME.accent : THEME.textDim, fontVariantNumeric: 'tabular-nums' }}>{user.seasonPts}</span>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 8.5, color: THEME.textFaint, textTransform: 'uppercase', letterSpacing: '0.12em' }}>pts</span>
        </div>
      </div>
    </div>
  );
}

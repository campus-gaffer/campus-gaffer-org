import { TEAMS } from '../../lib/players';

export default function PlayerRow({ player, role, starters, bench, remaining, onSelect, onDeselect }: any) {
  const price = player.price ?? null;
  let variant: string, label: string, action: any;

  if (price === null) {
    variant = 'unpriced'; label = 'Unpriced'; action = null;
  } else if (role) {
    variant = role;
    label = role === 'starter' ? '✓ Starter' : '✓ Bench';
    action = () => onDeselect(player.id);
  } else if (starters < 6) {
    const ok = player.price <= remaining;
    variant = ok ? 'add-starter' : 'budget';
    label = ok ? '+ Starter' : 'Budget';
    action = ok ? () => onSelect(player.id, 'starter') : null;
  } else if (bench < 4) {
    const ok = player.price <= remaining;
    variant = ok ? 'add-bench' : 'budget';
    label = ok ? '+ Bench' : 'Budget';
    action = ok ? () => onSelect(player.id, 'bench') : null;
  } else {
    variant = 'budget'; label = 'Full'; action = null;
  }

  const accentStripe = role === 'starter' ? '#4aa96c' : role === 'bench' ? '#7a63c9' : null;

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center', height: 60, gap: 12, paddingLeft: 16, paddingRight: 16, background: role ? 'rgba(255,255,255,0.02)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      {accentStripe && <div style={{ position: 'absolute', left: 0, top: 14, bottom: 14, width: 2.5, borderRadius: 2, background: accentStripe }} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 15, color: '#f6f6f8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{player.name}</div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'rgba(235,235,245,0.62)', marginTop: 2 }}>{TEAMS[player.team] || player.team}</div>
      </div>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 13.5, color: '#7ad58a', letterSpacing: '0.02em', flexShrink: 0 }}>{player.price !== null ? `£${player.price.toFixed(1)}` : '—'}</span>
      <button type="button" onClick={action} style={{ height: 30, padding: '0 11px', borderRadius: 8, border: '1px solid rgba(255,255,255,0.06)', background: variant === 'starter' ? 'oklch(0.68 0.16 234 / 0.14)' : variant === 'bench' ? 'oklch(0.68 0.15 295 / 0.14)' : variant === 'add-starter' || variant === 'add-bench' ? 'oklch(0.82 0.19 142 / 0.13)' : 'rgba(255,255,255,0.04)', color: variant === 'starter' ? 'oklch(0.68 0.16 234)' : variant === 'bench' ? 'oklch(0.68 0.15 295)' : 'rgba(235,235,245,0.9)', cursor: action ? 'pointer' : 'not-allowed', fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 12 }}>
        {label}
      </button>
    </div>
  );
}

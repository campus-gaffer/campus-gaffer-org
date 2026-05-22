 

export default function DeadlineChip({ urgency = 'low' }: any) {
  const cfg: any = {
    low:  { bg: 'oklch(0.82 0.19 142 / 0.13)', border: 'oklch(0.48 0.10 142)', color: '#6bc07a', label: 'Sat 24 May · 14:00 · 3d 4h' },
    mid:  { bg: 'oklch(0.78 0.16 60 / 0.13)', border: 'oklch(0.36 0.07 60)', color: '#f0a500', label: 'Sat 24 May · 14:00 · 18h 30m' },
    high: { bg: 'oklch(0.68 0.20 25 / 0.13)', border: 'oklch(0.30 0.08 25)', color: '#d94a4a', label: 'Sat 24 May · 14:00 · 4h 20m' },
  };
  const c = cfg[urgency] || cfg.low;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0, padding: '4px 10px', borderRadius: 20, background: c.bg, border: `1px solid ${c.border}`, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: c.color, whiteSpace: 'nowrap' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: c.color, flexShrink: 0 }} />
      {c.label}
    </div>
  );
}

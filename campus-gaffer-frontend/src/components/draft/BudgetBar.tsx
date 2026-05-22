import { BUDGET } from '../../lib/players';

export default function BudgetBar({ spent, starters, bench }: any) {
  const remaining = BUDGET - spent;
  const pct = Math.min(100, (spent / BUDGET) * 100);
  const barColor = remaining > 10 ? '#6bc07a' : remaining >= 5 ? '#f0a500' : '#d94a4a';
  return (
    <div style={{ padding: '6px 16px 14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 8, marginBottom: 8 }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'rgba(235,235,245,0.62)', letterSpacing: '0.04em' }}>£{spent.toFixed(1)} spent</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: 'rgba(235,235,245,0.40)', textAlign: 'right', whiteSpace: 'nowrap' }}>£{remaining.toFixed(1)} left · Starters {starters}/6 · Bench {bench}/4</span>
      </div>
      <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, borderRadius: 2, background: barColor, transition: 'width 280ms ease, background 280ms' }} />
      </div>
    </div>
  );
}

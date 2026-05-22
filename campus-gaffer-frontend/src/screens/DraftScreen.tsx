import { useMemo, useState, useEffect } from 'react';
import './screen-shared.css';
import { SQUAD_DATA_KEY, SQUAD_LOCK_KEY } from '../lib/mockSquad';
import { PLAYERS, BUDGET, MAX_S, MAX_B } from '../lib/players';
import { ScreenShell } from '../layouts/ScreenShell';
import PlayerRow from '../components/draft/PlayerRow';
import BudgetBar from '../components/draft/BudgetBar';
import DeadlineChip from '../components/draft/DeadlineChip';
import ConfirmModal from '../components/draft/ConfirmModal';
import DraftFooterActions from '../components/draft/DraftFooterActions';

const PAL = {
  bg2: 'oklch(0.10 0.02 248)',
  card: 'oklch(0.17 0.03 248)',
  text: '#fff',
  textFaint: 'rgba(235,235,245,0.45)',
  accent: 'oklch(0.82 0.19 142)',
};

export default function DraftScreen({ onBack, onConfirm }: { onBack: () => void; onConfirm: () => void }) {
  const pool = useMemo(() => PLAYERS, []);
  const [starters, setStarters] = useState<number[]>([]);
  const [bench, setBench] = useState<number[]>([]);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (showModal) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => { document.body.classList.remove('modal-open'); };
  }, [showModal]);

  function toggleStarter(id: number) {
    setStarters((s) => (s.includes(id) ? s.filter((x) => x !== id) : (s.length < MAX_S ? [...s, id] : s)));
    // ensure a player isn't both starter and bench
    setBench((b) => b.filter((x) => x !== id));
  }

  function toggleBench(id: number) {
    setBench((b) => (b.includes(id) ? b.filter((x) => x !== id) : (b.length < MAX_B ? [...b, id] : b)));
    setStarters((s) => s.filter((x) => x !== id));
  }

  function handleConfirm() {
    const spent = [...starters, ...bench].reduce((s, id) => {
      const p = pool.find((x) => x.id === id);
      return s + (p?.price || 0);
    }, 0);
    const remaining = BUDGET - spent;
    if (starters.length !== MAX_S || bench.length !== MAX_B || remaining < 0) return;
    const selectedStarters = starters.map((id) => pool.find((p) => p.id === id));
    const selectedBench = bench.map((id) => pool.find((p) => p.id === id));
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(SQUAD_DATA_KEY, JSON.stringify({ starters: selectedStarters, bench: selectedBench }));
      window.localStorage.setItem(SQUAD_LOCK_KEY, '1');
    }
    setShowModal(false);
    onConfirm();
  }

  const spent = [...starters, ...bench].reduce((s, id) => {
    const p = pool.find((x) => x.id === id);
    return s + (p?.price || 0);
  }, 0);
  const remaining = BUDGET - spent;
  const canConfirm = starters.length === MAX_S && bench.length === MAX_B && remaining >= 0;

  return (
    <ScreenShell
      background={PAL.bg2}
      color={PAL.text}
      bodyClassName="draft-scroll"
      header={(
        <>
          <button type="button" aria-label="Back" onClick={onBack} className="icon-btn" style={{ borderColor: 'rgba(255,255,255,0.06)', color: PAL.text }}>
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div className="screen-title">Draft Your Squad</div>
          <div style={{ width: 44 }} />
        </>
      )}
      footer={<DraftFooterActions canConfirm={canConfirm} onBack={onBack} onConfirm={() => setShowModal(true)} />}
    >
      <div style={{ padding: 12 }}>
        <div style={{ margin: '8px 6px 18px', padding: 12, borderRadius: 12, background: PAL.card }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: PAL.textFaint }}>Pick 6 starters and 4 bench players. Transfers are locked for MVP.</div>
        </div>

        <div style={{ display: 'grid', gap: 8 }}>
          <div style={{ marginTop: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 6px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 20, height: 20 }} />
                <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 18, color: '#f6f6f8' }}>Draft Your Squad</div>
              </div>
              <DeadlineChip urgency="low" />
            </div>
            <BudgetBar spent={spent} starters={starters.length} bench={bench.length} />
          </div>
          {pool.map((p) => (
            <PlayerRow
              key={p.id}
              player={p}
              role={starters.includes(p.id) ? 'starter' : bench.includes(p.id) ? 'bench' : null}
              starters={starters.length}
              bench={bench.length}
              remaining={remaining}
              onSelect={(id: number, role: string) => (role === 'starter' ? toggleStarter(id) : toggleBench(id))}
              onDeselect={(id: number) => {
                setStarters((s) => s.filter((x) => x !== id));
                setBench((b) => b.filter((x) => x !== id));
              }}
            />
          ))}
        </div>
      </div>
      {showModal && <ConfirmModal spent={spent} onBack={() => setShowModal(false)} onConfirm={handleConfirm} />}
    </ScreenShell>
  );
}

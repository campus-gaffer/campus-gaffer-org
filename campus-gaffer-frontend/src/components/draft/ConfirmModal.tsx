import ReactDOM from 'react-dom';
import { BUDGET } from '../../lib/players';

export default function ConfirmModal({ spent, onBack, onConfirm, confirming = false }: any) {
  const modal = (
    <div style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(6,8,16,0.80)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', display: 'flex', alignItems: 'flex-end' }}>
      <div style={{ width: '100%', background: 'oklch(0.165 0.032 248)', borderRadius: '22px 22px 0 0', border: '1px solid oklch(0.28 0.04 248)', padding: '28px 24px calc(28px + env(safe-area-inset-bottom))' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: 'oklch(0.82 0.19 142 / 0.13)', border: '1px solid oklch(0.48 0.10 142)' , display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <rect x="5" y="12" width="16" height="11" rx="3" stroke="#6bc07a" strokeWidth="2" />
              <path d="M9 12V8.5a4 4 0 018 0V12" stroke="#6bc07a" strokeWidth="2" strokeLinecap="round" />
              <circle cx="13" cy="17.5" r="1.8" fill="#6bc07a" />
            </svg>
          </div>
        </div>

        <h2 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 23, color: '#f6f6f8', margin: '0 0 10px', textAlign: 'center' }}>Lock in your squad?</h2>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, lineHeight: 1.55, color: 'rgba(235,235,245,0.62)', margin: '0 0 10px', textAlign: 'center' }}>Your squad locks for the season. No transfers. No changes.</p>

        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: '#6bc07a', textAlign: 'center', margin: '0 0 22px' }}>
          £{spent.toFixed(1)} of £{BUDGET.toFixed(1)} used
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onBack} style={{ flex: 1, height: 52, borderRadius: 14, border: '1.5px solid oklch(0.28 0.04 248)', background: 'transparent', color: '#f6f6f8', fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 15 }}>Go back</button>
          <button onClick={onConfirm} disabled={confirming} style={{ flex: 1, height: 52, borderRadius: 14, border: 'none', background: confirming ? '#3d7a4a' : '#6bc07a', color: '#08120a', fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 15, boxShadow: confirming ? 'none' : '0 8px 24px -10px #6bc07a', cursor: confirming ? 'not-allowed' : 'pointer', opacity: confirming ? 0.7 : 1 }}>{confirming ? 'Saving…' : 'Confirm & Lock'}</button>
        </div>
      </div>
    </div>
  );

  if (typeof document === 'undefined') return modal; // SSR fallback
  return ReactDOM.createPortal(modal, document.body);
}

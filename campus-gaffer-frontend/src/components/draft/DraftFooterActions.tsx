type DraftFooterActionsProps = {
  canConfirm: boolean;
  onBack: () => void;
  onConfirm: () => void;
};

export default function DraftFooterActions({ canConfirm, onBack, onConfirm }: DraftFooterActionsProps) {
  return (
    <div
      style={{
        padding: '12px 16px calc(12px + env(safe-area-inset-bottom))',
        background: 'linear-gradient(180deg, rgba(6,8,16,0) 0%, rgba(6,8,16,0.92) 24%, rgba(6,8,16,0.98) 100%)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 -14px 28px -20px rgba(0,0,0,0.75)',
      }}
    >
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          type="button"
          onClick={onBack}
          style={{
            flex: 1,
            height: 48,
            padding: '0 14px',
            borderRadius: 12,
            background: 'transparent',
            border: '1px solid rgba(255,255,255,0.08)',
            color: '#f6f6f8',
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 700,
            fontSize: 15,
            cursor: 'pointer',
          }}
        >
          Go back
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={!canConfirm}
          style={{
            flex: 1,
            height: 48,
            padding: '0 14px',
            borderRadius: 12,
            background: canConfirm ? 'oklch(0.82 0.19 142)' : 'rgba(255,255,255,0.08)',
            color: canConfirm ? '#08120a' : 'rgba(235,235,245,0.45)',
            border: 'none',
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 700,
            fontSize: 15,
            cursor: canConfirm ? 'pointer' : 'not-allowed',
            boxShadow: canConfirm ? '0 8px 24px -10px #6bc07a' : 'none',
          }}
        >
          Confirm &amp; Lock
        </button>
      </div>
    </div>
  );
}

import type { ReactNode } from 'react';
import { THEME, withAlpha } from '../lib/theme';

export type NotificationItem = {
  icon: ReactNode;
  title: string;
  subtitle: string;
  onTap: () => void;
};

type Props = {
  notifications: NotificationItem[];
  open: boolean;
  onClose: () => void;
};

// Minimal bottom-sheet. Backdrop click closes; no draggable handle yet.
// Kept self-contained so HomeScreen can pass any notifications array — the
// only consumer right now is the "set your display name" nudge.
export default function NotificationsSheet({ notifications, open, onClose }: Props) {
  if (!open) return null;
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 50,
          animation: 'cg-fadein 160ms ease-out',
        }}
      />
      {/* Sheet */}
      <div
        role="dialog"
        aria-label="Notifications"
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          background: THEME.bg2,
          borderTop: `1px solid ${THEME.line}`,
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          padding: '8px 0 24px',
          zIndex: 51,
          animation: 'cg-slideup 220ms cubic-bezier(.2,.7,.2,1)',
          boxShadow: '0 -8px 28px rgba(0,0,0,0.5)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', padding: '6px 0 10px' }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, background: withAlpha(THEME.text, 0.18) }} />
        </div>
        <div style={{ padding: '0 16px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.22em', textTransform: 'uppercase', color: THEME.textFaint, fontWeight: 700 }}>Notifications</span>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: THEME.textFaint,
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 11,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              cursor: 'pointer',
              padding: '4px 6px',
            }}
          >Close</button>
        </div>
        <div style={{ marginTop: 6 }}>
          {notifications.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.10em', color: THEME.textFaint }}>
              You're all caught up.
            </div>
          ) : (
            notifications.map((n, i) => (
              <button
                key={i}
                type="button"
                onClick={n.onTap}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '12px 16px',
                  background: 'transparent',
                  border: 'none',
                  borderTop: `1px solid ${THEME.lineDim}`,
                  cursor: 'pointer',
                  textAlign: 'left',
                  color: 'inherit',
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    background: withAlpha(THEME.accent, 0.15),
                    border: `1px solid ${withAlpha(THEME.accent, 0.35)}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    fontSize: 18,
                  }}
                >
                  {n.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 14, color: THEME.text, letterSpacing: '-0.01em' }}>{n.title}</div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: THEME.textFaint, marginTop: 2 }}>{n.subtitle}</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true" style={{ color: THEME.textFaint, flexShrink: 0 }}>
                  <path d="M3 7h8M7 3l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            ))
          )}
        </div>
      </div>
      <style>{`
        @keyframes cg-fadein { from { opacity: 0; } to { opacity: 1; } }
        @keyframes cg-slideup { from { transform: translateY(100%); } to { transform: translateY(0); } }
      `}</style>
    </>
  );
}

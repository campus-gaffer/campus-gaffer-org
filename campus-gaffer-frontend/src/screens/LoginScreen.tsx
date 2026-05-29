import { useState } from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import { BrandMark } from '../components/BrandMark';

const PALETTE = {
  bg: 'oklch(0.16 0.03 248)',
  bg2: 'oklch(0.12 0.025 248)',
  line: 'oklch(0.28 0.04 248)',
  accent: 'oklch(0.82 0.19 142)',
};

function PitchBackdrop() {
  const line = PALETTE.line;
  return (
    <svg
      width="100%" height="100%" viewBox="0 0 390 844"
      preserveAspectRatio="xMidYMid slice"
      style={{ position: 'absolute', inset: 0, opacity: 0.32, pointerEvents: 'none' }}
      aria-hidden="true"
    >
      <circle cx="195" cy="-20" r="180" fill="none" stroke={line} strokeWidth="1" />
      <circle cx="195" cy="-20" r="60" fill="none" stroke={line} strokeWidth="1" />
      <line x1="0" y1="-20" x2="390" y2="-20" stroke={line} strokeWidth="1" />
      <path d="M 0 844 A 20 20 0 0 0 20 824" fill="none" stroke={line} strokeWidth="1" />
      <path d="M 370 824 A 20 20 0 0 0 390 844" fill="none" stroke={line} strokeWidth="1" />
      {Array.from({ length: 12 }).map((_, i) => (
        <line key={i} x1="0" y1={70 * i + 35} x2="390" y2={70 * i + 35} stroke={line} strokeWidth="0.5" opacity="0.35" />
      ))}
    </svg>
  );
}

function TabSwitcher({ mode, onChange }: { mode: 'login' | 'signup'; onChange: (mode: 'login' | 'signup') => void }) {
  return (
    <div style={{
      position: 'relative',
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      height: 46,
      borderRadius: 12,
      background: 'rgba(255,255,255,0.04)',
      border: '1px solid rgba(255,255,255,0.06)',
      padding: 4,
    }}>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: 4,
          left: mode === 'login' ? 4 : 'calc(50% + 0px)',
          width: 'calc(50% - 4px)',
          height: 'calc(100% - 8px)',
          background: PALETTE.accent,
          borderRadius: 9,
          transition: 'left 280ms cubic-bezier(.4,0,.2,1)',
        }}
      />
      {(['login', 'signup'] as const).map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          style={{
            position: 'relative',
            zIndex: 1,
            background: 'transparent',
            border: 'none',
            color: mode === value ? 'oklch(0.18 0.04 142)' : 'rgba(235,235,245,0.7)',
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontWeight: 700,
            fontSize: 14,
            cursor: 'pointer',
          }}
        >
          {value === 'login' ? 'Log In' : 'Sign Up'}
        </button>
      ))}
    </div>
  );
}

export default function LoginScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100%',
      background: `radial-gradient(120% 60% at 50% 0%, ${PALETTE.bg} 0%, ${PALETTE.bg2} 70%)`,
      color: '#fff',
      fontFamily: "'DM Sans', sans-serif",
      overflow: 'hidden',
    }}>
      <PitchBackdrop />
      <div style={{
        position: 'absolute',
        inset: 0,
        background: `radial-gradient(80% 50% at 50% 100%, ${PALETTE.bg2} 0%, transparent 60%)`,
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative',
        zIndex: 2,
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: '64px 24px 28px',
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 22 }}>
          <BrandMark size={72} />
        </div>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: '0.2em', color: PALETTE.accent, textTransform: 'uppercase' }}>
            Campus Gaffer
          </div>
          <h1 style={{ margin: '10px 0 6px', fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: 34, lineHeight: 1, letterSpacing: '-0.04em' }}>
            Secure Sign-In
          </h1>
          <p style={{ margin: 0, color: 'rgba(235,235,245,0.68)', fontSize: 14 }}>
            Authentication is now handled by Clerk so squad ownership comes from your verified session.
          </p>
        </div>

        <div style={{ maxWidth: 420, width: '100%', margin: '0 auto' }}>
          <TabSwitcher mode={mode} onChange={setMode} />
        </div>

        <div style={{
          margin: '18px auto 0',
          width: '100%',
          maxWidth: 420,
          background: 'rgba(8, 12, 22, 0.72)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 18,
          padding: 16,
          backdropFilter: 'blur(12px)',
        }}>
          {mode === 'login' ? (
            <SignIn
              routing="virtual"
              fallbackRedirectUrl="/home"
              appearance={{
                elements: {
                  card: { boxShadow: 'none', background: 'transparent' },
                  headerTitle: { display: 'none' },
                  headerSubtitle: { display: 'none' },
                  socialButtonsBlockButton: { borderRadius: '12px' },
                  formButtonPrimary: { background: PALETTE.accent, color: '#0f1b12', borderRadius: '12px' },
                  footerActionLink: { color: '#b8f7ce' },
                },
              }}
            />
          ) : (
            <SignUp
              routing="virtual"
              fallbackRedirectUrl="/home"
              appearance={{
                elements: {
                  card: { boxShadow: 'none', background: 'transparent' },
                  headerTitle: { display: 'none' },
                  headerSubtitle: { display: 'none' },
                  socialButtonsBlockButton: { borderRadius: '12px' },
                  formButtonPrimary: { background: PALETTE.accent, color: '#0f1b12', borderRadius: '12px' },
                  footerActionLink: { color: '#b8f7ce' },
                },
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

import { useCallback, useState } from 'react';
import { useSignIn } from '@clerk/clerk-react';
import { BrandMark } from '../components/BrandMark';

// The OAuth providers enabled on our Clerk instance. Clerk's strategy strings
// are `oauth_<provider>`; kept local to avoid depending on @clerk/types.
type OAuthStrategy = 'oauth_google' | 'oauth_apple';

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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.85.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.47.9 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="17" height="18" viewBox="0 0 16 20" fill="currentColor" aria-hidden="true">
      <path d="M13.24 10.62c-.02-2.2 1.8-3.26 1.88-3.31-1.03-1.5-2.62-1.71-3.19-1.73-1.36-.14-2.65.8-3.34.8-.69 0-1.75-.78-2.88-.76-1.48.02-2.85.86-3.61 2.19-1.54 2.67-.39 6.62 1.11 8.79.73 1.06 1.6 2.25 2.74 2.21 1.1-.04 1.51-.71 2.84-.71 1.32 0 1.7.71 2.86.69 1.18-.02 1.93-1.08 2.65-2.15.84-1.23 1.18-2.42 1.2-2.48-.03-.01-2.29-.88-2.31-3.49zM11.05 3.87c.61-.74 1.02-1.77.91-2.79-.88.04-1.94.59-2.57 1.32-.56.65-1.06 1.7-.93 2.7.98.08 1.98-.5 2.59-1.23z" />
    </svg>
  );
}

function SocialButton({
  label,
  icon,
  disabled,
  pending,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  disabled: boolean;
  pending: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        width: '100%',
        height: 48,
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(255,255,255,0.06)',
        color: '#fff',
        fontFamily: "'Bricolage Grotesque', sans-serif",
        fontWeight: 700,
        fontSize: 15,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled && !pending ? 0.5 : 1,
        transition: 'opacity 160ms ease',
      }}
    >
      <span style={{ display: 'inline-flex', width: 18, height: 18, alignItems: 'center', justifyContent: 'center' }}>
        {icon}
      </span>
      <span>{pending ? 'Redirecting…' : label}</span>
    </button>
  );
}

export default function LoginScreen() {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const { isLoaded, signIn } = useSignIn();
  const [pending, setPending] = useState<OAuthStrategy | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Social sign-in and sign-up share one path in Clerk: authenticateWithRedirect
  // on the SignIn resource transparently creates the account on first login, so
  // both tabs drive the same handler — the tab only changes the button copy.
  const authenticateWith = useCallback(
    async (strategy: OAuthStrategy) => {
      if (!isLoaded || !signIn) return;
      setError(null);
      setPending(strategy);
      try {
        await signIn.authenticateWithRedirect({
          strategy,
          redirectUrl: '/sso-callback',
          redirectUrlComplete: '/home',
        });
        // On success the browser navigates to the provider, so nothing runs
        // past this point.
      } catch (err) {
        setPending(null);
        setError('Could not start sign-in. Please try again.');
        console.error('OAuth redirect failed', err);
      }
    },
    [isLoaded, signIn],
  );

  const verb = mode === 'login' ? 'Log in' : 'Sign up';
  const disabled = !isLoaded || pending !== null;

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
            Continue with Google or Apple — your verified session decides squad ownership.
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <SocialButton
              label={`${verb} with Google`}
              icon={<GoogleIcon />}
              disabled={disabled}
              pending={pending === 'oauth_google'}
              onClick={() => authenticateWith('oauth_google')}
            />
            <SocialButton
              label={`${verb} with Apple`}
              icon={<AppleIcon />}
              disabled={disabled}
              pending={pending === 'oauth_apple'}
              onClick={() => authenticateWith('oauth_apple')}
            />
          </div>

          {error && (
            <div
              role="alert"
              style={{
                marginTop: 14,
                padding: '10px 12px',
                borderRadius: 10,
                background: 'rgba(255, 90, 90, 0.10)',
                border: '1px solid rgba(255, 90, 90, 0.35)',
                color: '#ffbdbd',
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 12,
                lineHeight: 1.5,
              }}
            >
              {error}
            </div>
          )}

          <p style={{
            margin: '16px 2px 0',
            color: 'rgba(235,235,245,0.45)',
            fontSize: 11,
            lineHeight: 1.6,
            fontFamily: "'JetBrains Mono', monospace",
            textAlign: 'center',
          }}>
            {mode === 'login'
              ? 'New here? Signing in with a social account creates it automatically.'
              : 'We use your Google or Apple profile — including your picture — to set up your account.'}
          </p>
        </div>
      </div>
    </div>
  );
}

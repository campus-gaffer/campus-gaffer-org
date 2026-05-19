import { useState } from 'react';

// ─── Palette ───────────────────────────────────────────────────────────────
const PALETTE = {
  bg: 'oklch(0.16 0.03 248)',
  bg2: 'oklch(0.12 0.025 248)',
  line: 'oklch(0.28 0.04 248)',
  accent: 'oklch(0.82 0.19 142)',
  accentDeep: 'oklch(0.72 0.20 142)',
  accentInk: 'oklch(0.18 0.04 142)',
};

// ─── BallMark ──────────────────────────────────────────────────────────────
function BallMark({ size = 28 }: { size?: number }) {
  const a = PALETTE.accent;
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" aria-hidden="true">
      <circle cx="14" cy="14" r="13" fill="none" stroke={a} strokeWidth="2" />
      <polygon points="14,7 19.5,11 17.4,17.5 10.6,17.5 8.5,11" fill={a} stroke={a} strokeLinejoin="round" strokeWidth="1" />
      <line x1="14" y1="7" x2="14" y2="2" stroke={a} strokeWidth="1.4" />
      <line x1="19.5" y1="11" x2="24" y2="8.5" stroke={a} strokeWidth="1.4" />
      <line x1="17.4" y1="17.5" x2="20.5" y2="22.5" stroke={a} strokeWidth="1.4" />
      <line x1="10.6" y1="17.5" x2="7.5" y2="22.5" stroke={a} strokeWidth="1.4" />
      <line x1="8.5" y1="11" x2="4" y2="8.5" stroke={a} strokeWidth="1.4" />
    </svg>
  );
}

// ─── Pitch backdrop ────────────────────────────────────────────────────────
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
        <line key={i} x1="0" y1={70 * i + 35} x2="390" y2={70 * i + 35}
          stroke={line} strokeWidth="0.5" opacity="0.35" />
      ))}
    </svg>
  );
}

// ─── Field component ───────────────────────────────────────────────────────
interface FieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  autoComplete?: string;
  hint?: string;
}

function Field({ label, type = 'text', value, onChange, error, autoComplete, hint }: FieldProps) {
  const [focused, setFocused] = useState(false);
  const [reveal, setReveal] = useState(false);
  const isPassword = type === 'password';
  const active = focused || value.length > 0;
  const inputType = isPassword ? (reveal ? 'text' : 'password') : type;
  const borderColor = error ? 'oklch(0.68 0.18 25)' : focused ? PALETTE.accent : PALETTE.line;

  return (
    <label style={{ display: 'block', position: 'relative', marginBottom: 14 }}>
      <span style={{
        position: 'absolute', left: 16, top: active ? 8 : 22,
        fontSize: active ? 10 : 14,
        fontFamily: active ? "'JetBrains Mono', monospace" : "'DM Sans', sans-serif",
        letterSpacing: active ? '0.12em' : '0',
        textTransform: active ? 'uppercase' : 'none',
        color: active ? (error ? 'oklch(0.78 0.16 25)' : PALETTE.accent) : 'rgba(235,235,245,0.55)',
        transition: 'all 160ms cubic-bezier(.4,0,.2,1)',
        pointerEvents: 'none', fontWeight: 500,
      }}>{label}</span>
      <input
        type={inputType} value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        autoComplete={autoComplete} spellCheck={false}
        style={{
          width: '100%', height: 58,
          padding: '22px 48px 6px 16px',
          background: 'rgba(255,255,255,0.03)',
          border: `1px solid ${borderColor}`,
          borderRadius: 14, color: '#fff', fontSize: 15,
          fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
          outline: 'none', transition: 'border-color 140ms, background 140ms',
          caretColor: PALETTE.accent, boxSizing: 'border-box',
        }}
      />
      {isPassword && (
        <button type="button" onClick={() => setReveal(r => !r)}
          aria-label={reveal ? 'Hide password' : 'Show password'}
          style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            width: 36, height: 36, borderRadius: 10, background: 'transparent',
            border: 'none', color: 'rgba(235,235,245,0.6)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0,
          }}>
          {reveal ? (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 9s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.4" />
              <circle cx="9" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <path d="M2 9s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z" stroke="currentColor" strokeWidth="1.4" />
              <line x1="3" y1="3" x2="15" y2="15" stroke="currentColor" strokeWidth="1.4" />
            </svg>
          )}
        </button>
      )}
      <div style={{
        height: 18, marginTop: 4, paddingLeft: 16, fontSize: 11,
        fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.04em',
        color: error ? 'oklch(0.78 0.16 25)' : 'rgba(235,235,245,0.45)',
      }}>{error || hint || ''}</div>
    </label>
  );
}

// ─── Checkbox row ──────────────────────────────────────────────────────────
function CheckRow({ checked, onChange, children }: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
      <span onClick={(e) => { e.preventDefault(); onChange(!checked); }} style={{
        width: 18, height: 18, borderRadius: 5,
        border: `1.5px solid ${checked ? PALETTE.accent : 'rgba(235,235,245,0.4)'}`,
        background: checked ? PALETTE.accent : 'transparent',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0, marginTop: 1, transition: 'all 140ms',
      }}>
        {checked && (
          <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
            <path d="M2 5.5L4.5 8L9 3" stroke={PALETTE.accentInk} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <span style={{ fontSize: 12, color: 'rgba(235,235,245,0.7)', lineHeight: 1.4, fontFamily: "'DM Sans', sans-serif" }}>
        {children}
      </span>
    </label>
  );
}

// ─── Validation ────────────────────────────────────────────────────────────
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function validateEmail(v: string) { return v && !EMAIL_RE.test(v) ? 'Enter a valid email address' : ''; }
function validatePw(v: string, isSignup: boolean) { return v && isSignup && v.length < 8 ? 'Min. 8 characters' : ''; }
function pwStrength(v: string) {
  let s = 0;
  if (v.length >= 8) s++;
  if (/[A-Z]/.test(v)) s++;
  if (/[0-9]/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v)) s++;
  return Math.min(s, 4);
}

// ─── Tab switcher ──────────────────────────────────────────────────────────
function TabSwitcher({ mode, onChange }: { mode: 'login' | 'signup'; onChange: (m: 'login' | 'signup') => void }) {
  return (
    <div role="tablist" style={{
      position: 'relative', display: 'grid', gridTemplateColumns: '1fr 1fr',
      height: 46, borderRadius: 12,
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', padding: 4,
    }}>
      <div aria-hidden="true" style={{
        position: 'absolute', top: 4, left: mode === 'login' ? 4 : 'calc(50% + 0px)',
        width: 'calc(50% - 4px)', height: 'calc(100% - 8px)',
        background: PALETTE.accent, borderRadius: 9,
        transition: 'left 280ms cubic-bezier(.4,0,.2,1)',
        boxShadow: `0 6px 18px -8px ${PALETTE.accent}`,
      }} />
      {(['login', 'signup'] as const).map(m => (
        <button key={m} type="button" role="tab" aria-selected={mode === m} onClick={() => onChange(m)} style={{
          position: 'relative', zIndex: 1, background: 'transparent', border: 'none',
          color: mode === m ? PALETTE.accentInk : 'rgba(235,235,245,0.7)',
          fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 14,
          letterSpacing: '0.01em', cursor: 'pointer', transition: 'color 200ms',
        }}>
          {m === 'login' ? 'Log In' : 'Sign Up'}
        </button>
      ))}
    </div>
  );
}

// ─── Spinner ───────────────────────────────────────────────────────────────
function Spinner({ color }: { color: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" style={{ animation: 'cg-spin 800ms linear infinite' }}>
      <circle cx="9" cy="9" r="7" fill="none" stroke={color} strokeOpacity="0.3" strokeWidth="2" />
      <path d="M9 2a7 7 0 0 1 7 7" stroke={color} strokeWidth="2" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// ─── Google glyph ──────────────────────────────────────────────────────────
function GoogleGlyph() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.49h4.84c-.21 1.13-.84 2.08-1.79 2.72v2.26h2.9c1.7-1.56 2.69-3.87 2.69-6.63z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.83.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.34A8.99 8.99 0 0 0 9 18z" fill="#34A853" />
      <path d="M3.95 10.7A5.41 5.41 0 0 1 3.66 9c0-.59.1-1.16.29-1.7V4.96H.96A8.99 8.99 0 0 0 0 9c0 1.45.35 2.82.96 4.04l2.99-2.34z" fill="#FBBC05" />
      <path d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A8.99 8.99 0 0 0 9 0 8.99 8.99 0 0 0 .96 4.96l2.99 2.34C4.66 5.17 6.65 3.58 9 3.58z" fill="#EA4335" />
    </svg>
  );
}

// ─── Main ──────────────────────────────────────────────────────────────────
export default function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [pw, setPw] = useState('');
  const [name, setName] = useState('');
  const [remember, setRemember] = useState(true);
  const [agree, setAgree] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [shake, setShake] = useState(false);

  const isSignup = mode === 'signup';
  const errors = { email: validateEmail(email), pw: validatePw(pw, isSignup) };
  const canSubmit = !submitting && email.length > 0 && pw.length > 0
    && !errors.email && !errors.pw && (!isSignup || (name.length > 0 && agree));

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) { setShake(true); setTimeout(() => setShake(false), 450); return; }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setSuccess(true);
      setTimeout(() => { setSuccess(false); onLogin(); }, 900);
    }, 1100);
  };

  const switchMode = (m: 'login' | 'signup') => { if (m !== mode) { setMode(m); setShake(false); } };
  const strength = pwStrength(pw);

  const pal = PALETTE;

  return (
    <div style={{
      position: 'relative', width: '100%', height: '100%',
      background: `radial-gradient(120% 60% at 50% 0%, ${pal.bg} 0%, ${pal.bg2} 70%)`,
      color: '#fff', fontFamily: "'DM Sans', sans-serif",
      overflow: 'hidden', display: 'flex', flexDirection: 'column',
    }}>
      <PitchBackdrop />
      <div style={{
        position: 'absolute', inset: 0,
        background: `radial-gradient(80% 50% at 50% 100%, ${pal.bg2} 0%, transparent 60%)`,
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'relative', zIndex: 2,
        padding: isSignup ? '58px 24px 0' : '70px 24px 0',
        display: 'flex', flexDirection: 'column', height: '100%',
        animation: shake ? 'cg-shake 420ms cubic-bezier(.36,.07,.19,.97)' : 'none',
      }}>
        {/* Wordmark */}
        <header style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <BallMark size={26} />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span style={{
              fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800,
              fontSize: 19, letterSpacing: '-0.01em', color: '#fff',
            }}>Campus Gaffer</span>
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5,
              letterSpacing: '0.22em', color: pal.accent, marginTop: 4, textTransform: 'uppercase',
            }}>Intramural · Fantasy</span>
          </div>
          <div style={{ flex: 1 }} />
          <div style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
            letterSpacing: '0.14em', color: 'rgba(235,235,245,0.5)', textTransform: 'uppercase',
          }}>S26 · GW07</div>
        </header>

        {/* Headline */}
        <h1 style={{
          fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700,
          fontSize: isSignup ? 28 : 32, lineHeight: 1.04,
          margin: isSignup ? '20px 0 6px' : '32px 0 8px',
          letterSpacing: '-0.02em', textWrap: 'balance',
        }}>
          {isSignup ? <><span>Draft your</span><br /><span>starting XI.</span></> : <><span>Welcome back,</span><br /><span>gaffer.</span></>}
        </h1>
        <p style={{
          fontSize: 13.5, color: 'rgba(235,235,245,0.6)',
          margin: isSignup ? '0 0 16px' : '0 0 22px',
          maxWidth: 300, lineHeight: 1.45,
        }}>
          {isSignup
            ? 'Build a squad from your university\'s intramural pool. Track points every gameweek.'
            : 'Pick up where you left off. The next deadline is closer than you think.'}
        </p>

        <TabSwitcher mode={mode} onChange={switchMode} />

        <form onSubmit={onSubmit} style={{ marginTop: isSignup ? 16 : 22, flex: 1, display: 'flex', flexDirection: 'column' }}>
          {isSignup && (
            <Field label="Display name" value={name} onChange={setName}
              autoComplete="nickname" hint="Shown on the leaderboard" />
          )}
          <Field label="Email" type="email" value={email} onChange={setEmail}
            error={errors.email} autoComplete="email" />
          <Field label="Password" type="password" value={pw} onChange={setPw}
            error={errors.pw} autoComplete={isSignup ? 'new-password' : 'current-password'}
            hint={isSignup && pw.length === 0 ? 'At least 8 characters' : ''} />

          {isSignup && pw.length > 0 && (
            <div style={{ display: 'flex', gap: 4, margin: '-12px 0 14px', paddingLeft: 2 }}>
              {[0, 1, 2, 3].map(i => (
                <div key={i} style={{
                  flex: 1, height: 3, borderRadius: 2,
                  background: i < strength ? pal.accent : 'rgba(255,255,255,0.08)',
                  transition: 'background 200ms',
                }} />
              ))}
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5,
                letterSpacing: '0.14em', color: 'rgba(235,235,245,0.55)',
                textTransform: 'uppercase', marginLeft: 8, alignSelf: 'center',
              }}>
                {['Weak', 'Weak', 'Fair', 'Good', 'Strong'][strength]}
              </span>
            </div>
          )}

          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginTop: 4, marginBottom: 18,
          }}>
            {isSignup ? (
              <CheckRow checked={agree} onChange={setAgree}>
                I agree to the <u>Code of Conduct</u> and <u>Privacy Policy</u>.
              </CheckRow>
            ) : (
              <>
                <CheckRow checked={remember} onChange={setRemember}>Keep me signed in</CheckRow>
                <button type="button" style={{
                  background: 'transparent', border: 'none', color: pal.accent,
                  fontFamily: "'DM Sans', sans-serif", fontSize: 12.5, fontWeight: 600,
                  cursor: 'pointer', padding: 0,
                }}>Forgot?</button>
              </>
            )}
          </div>

          {/* CTA */}
          <button type="submit" disabled={!canSubmit} style={{
            position: 'relative', height: 54, borderRadius: 14, border: 'none',
            background: success ? 'oklch(0.74 0.17 142)' : canSubmit ? pal.accent : 'rgba(255,255,255,0.08)',
            color: canSubmit || success ? pal.accentInk : 'rgba(235,235,245,0.4)',
            fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 16,
            letterSpacing: '0.02em', cursor: canSubmit ? 'pointer' : 'not-allowed',
            transition: 'all 180ms', display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 10, overflow: 'hidden', whiteSpace: 'nowrap',
            boxShadow: canSubmit ? `0 8px 24px -8px ${pal.accent}` : 'none',
          }}>
            {submitting ? (
              <>
                <Spinner color={pal.accentInk} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, letterSpacing: '0.18em' }}>
                  SIGNING IN…
                </span>
              </>
            ) : success ? (
              <>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M3 9.5L7 13L15 5" stroke={pal.accentInk} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>You&apos;re in</span>
              </>
            ) : (
              <>
                <span>{isSignup ? 'Join the League' : 'Kick Off'}</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </>
            )}
          </button>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: isSignup ? '16px 0' : '22px 0' }}>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            <span style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10,
              letterSpacing: '0.22em', color: 'rgba(235,235,245,0.45)', textTransform: 'uppercase',
            }}>or</span>
            <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
          </div>

          {/* Google OAuth */}
          <button type="button" style={{
            height: 52, borderRadius: 14, border: '1px solid rgba(255,255,255,0.12)',
            background: 'rgba(255,255,255,0.04)', color: '#fff',
            fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14.5,
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
            transition: 'background 140ms, border-color 140ms',
          }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; }}
          >
            <GoogleGlyph />
            <span>Continue with Google</span>
          </button>

          <div style={{ flex: 1 }} />
          <p style={{
            textAlign: 'center', fontSize: 11.5, color: 'rgba(235,235,245,0.45)',
            margin: isSignup ? '12px 0 44px' : '24px 0 44px',
            fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.08em', whiteSpace: 'nowrap',
          }}>
            {isSignup ? 'HAVE AN ACCOUNT?' : 'NEW HERE?'}{' '}
            <button type="button" onClick={() => switchMode(isSignup ? 'login' : 'signup')} style={{
              background: 'transparent', border: 'none', color: pal.accent,
              fontFamily: 'inherit', fontSize: 'inherit', letterSpacing: 'inherit',
              cursor: 'pointer', padding: 0, textTransform: 'uppercase', fontWeight: 600, whiteSpace: 'nowrap',
            }}>
              {isSignup ? 'Log in' : 'Sign up'}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

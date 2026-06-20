import { useEffect, useMemo, useState } from 'react';
import { useUser, SignOutButton } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { BrandMark } from '../components/BrandMark';
import { THEME, withAlpha } from '../lib/theme';
import { ScreenShell } from '../layouts/ScreenShell';
import { ApiError, getMe, patchMe, type Me } from '../lib/api';
import './screen-shared.css';

const HM = THEME;

// Matches backend handlers.displayNameRe + length bounds (see user_handler.go).
// Length is enforced separately so the regex doesn't need a {5,20} that would
// mis-count surrogate pairs.
const DISPLAY_NAME_RE = /^[\p{L}\p{N}_'\-.]+$/u;
const DISPLAY_NAME_MIN = 5;
const DISPLAY_NAME_MAX = 20;

function clientValidate(name: string): string | null {
  if (!name) return 'Display name required';
  if (name !== name.trim()) return 'No leading or trailing spaces';
  // Count Unicode code points, not UTF-16 code units, so "François" = 8.
  const runes = Array.from(name).length;
  if (runes < DISPLAY_NAME_MIN) return `Min ${DISPLAY_NAME_MIN} characters`;
  if (runes > DISPLAY_NAME_MAX) return `Max ${DISPLAY_NAME_MAX} characters`;
  if (!DISPLAY_NAME_RE.test(name)) return "Use letters, numbers, or _ ' - .";
  return null;
}

function formatJoined(d: Date | null | undefined): string {
  if (!d) return 'Joined recently';
  const months = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  return `Joined ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function Avatar({ imageUrl, fallbackInitial }: { imageUrl?: string | null; fallbackInitial: string }) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        style={{
          width: 84,
          height: 84,
          borderRadius: '50%',
          objectFit: 'cover',
          border: `2px solid ${withAlpha(HM.accent, 0.55)}`,
          boxShadow: `0 0 0 4px ${withAlpha(HM.accent, 0.12)}`,
        }}
      />
    );
  }
  return (
    <div
      style={{
        width: 84,
        height: 84,
        borderRadius: '50%',
        background: withAlpha(HM.accent, 0.18),
        color: HM.accent,
        border: `2px solid ${withAlpha(HM.accent, 0.45)}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: "'Bricolage Grotesque', sans-serif",
        fontWeight: 800,
        fontSize: 34,
        letterSpacing: '-0.02em',
      }}
    >
      {fallbackInitial}
    </div>
  );
}

type SaveState =
  | { status: 'idle' }
  | { status: 'saving' }
  | { status: 'success' }
  | { status: 'error'; message: string };

export default function ProfileScreen() {
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();
  const [me, setMe] = useState<Me | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [touched, setTouched] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>({ status: 'idle' });

  // Pull the authoritative user row (DB → backend). Clerk's `username`
  // hangs off useUser() but we always prefer the backend's, because the DB
  // is the source of truth for the leaderboard / squad ownership joins.
  useEffect(() => {
    const ctrl = new AbortController();
    getMe(ctrl.signal)
      .then((data) => {
        setMe(data);
        setDisplayName(data.username);
      })
      .catch(() => { /* leave inputs empty — user can still set a name */ });
    return () => ctrl.abort();
  }, []);

  const email = user?.primaryEmailAddress?.emailAddress ?? '—';
  const imageUrl = user?.imageUrl ?? null;
  const joined = useMemo(() => formatJoined(user?.createdAt ?? null), [user?.createdAt]);
  const fallbackInitial = (me?.username || user?.firstName || email || 'G').charAt(0).toUpperCase();

  const validationError = touched ? clientValidate(displayName) : null;
  const isUnchanged = me?.username === displayName;
  const canSave = !validationError && !isUnchanged && saveState.status !== 'saving';

  async function handleSave() {
    setTouched(true);
    const err = clientValidate(displayName);
    if (err) {
      setSaveState({ status: 'error', message: err });
      return;
    }
    setSaveState({ status: 'saving' });
    try {
      const updated = await patchMe(displayName);
      setMe(updated);
      setDisplayName(updated.username);
      setSaveState({ status: 'success' });
      // Auto-clear success indicator after a beat.
      window.setTimeout(() => setSaveState((s) => (s.status === 'success' ? { status: 'idle' } : s)), 2000);
    } catch (e) {
      const message = mapSaveError(e);
      setSaveState({ status: 'error', message });
    }
  }

  return (
    <ScreenShell
      background={HM.bg2}
      color={HM.text}
      header={(
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%' }}>
          <button
            type="button"
            aria-label="Back"
            onClick={() => navigate('/home')}
            style={{ width: 34, height: 34, borderRadius: '50%', border: `1px solid ${HM.line}`, background: 'rgba(255,255,255,0.03)', color: HM.text, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
          >
            <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
              <path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <BrandMark size={15} />
              <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 17, letterSpacing: '-0.01em' }}>Profile</span>
            </div>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: '0.20em', color: HM.accent, textTransform: 'uppercase', fontWeight: 600, marginTop: 2 }}>Account</span>
          </div>
          <div style={{ width: 34 }} />
        </div>
      )}
    >
      <div style={{ padding: '20px 18px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Identity card */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
          <Avatar imageUrl={imageUrl} fallbackInitial={fallbackInitial} />
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 20, color: HM.text, letterSpacing: '-0.01em' }}>
            {me?.username ?? (isLoaded ? '-' : '…')}
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, letterSpacing: '0.10em', color: HM.textFaint }}>{email}</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: '0.16em', color: HM.textFaint, textTransform: 'uppercase' }}>{joined}</div>
        </div>

        {/* Display name editor */}
        <section style={{ background: HM.card, border: `1px solid ${HM.lineDim}`, borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
          <label htmlFor="display-name" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: HM.textFaint, fontWeight: 700 }}>
            Display name
          </label>
          <input
            id="display-name"
            type="text"
            value={displayName}
            onChange={(e) => { setDisplayName(e.target.value); setTouched(true); if (saveState.status !== 'saving') setSaveState({ status: 'idle' }); }}
            onBlur={() => setTouched(true)}
            placeholder="Pick a name"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            style={{
              background: 'rgba(255,255,255,0.03)',
              border: `1px solid ${validationError ? HM.warn : HM.line}`,
              borderRadius: 10,
              padding: '12px 14px',
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: 15,
              color: HM.text,
              outline: 'none',
              transition: 'border-color 140ms',
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', minHeight: 16 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, letterSpacing: '0.10em', color: validationError ? HM.warn : HM.textFaint }}>
              {validationError ?? "5-20 chars · letters, numbers, _ ' - ."}
            </span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 9.5, color: HM.textFaint, fontVariantNumeric: 'tabular-nums' }}>
              {Array.from(displayName).length}/{DISPLAY_NAME_MAX}
            </span>
          </div>
          {saveState.status === 'error' && (
            <div role="alert" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: HM.warn }}>
              {saveState.message}
            </div>
          )}
          {saveState.status === 'success' && (
            <div role="status" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10.5, color: HM.accent }}>
              Saved.
            </div>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={!canSave}
            style={{
              alignSelf: 'flex-end',
              padding: '10px 18px',
              borderRadius: 10,
              border: 'none',
              background: canSave ? HM.accent : withAlpha(HM.accent, 0.25),
              color: canSave ? '#08120a' : withAlpha('#08120a', 0.6),
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontWeight: 700,
              fontSize: 14,
              cursor: canSave ? 'pointer' : 'not-allowed',
              transition: 'background 140ms',
            }}
          >
            {saveState.status === 'saving' ? 'Saving…' : 'Save'}
          </button>
        </section>

        {/* Account actions */}
        <section style={{ background: HM.card, border: `1px solid ${HM.lineDim}`, borderRadius: 14, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: HM.textFaint, fontWeight: 700 }}>
            Account
          </span>
          <SignOutButton>
            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{
                padding: '12px 14px',
                borderRadius: 10,
                border: `1px solid ${HM.line}`,
                background: 'transparent',
                color: HM.text,
                fontFamily: "'Bricolage Grotesque', sans-serif",
                fontWeight: 600,
                fontSize: 14,
                cursor: 'pointer',
                textAlign: 'left',
              }}
            >
              Sign out
            </button>
          </SignOutButton>
          <p style={{ margin: 0, fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: '0.08em', color: HM.textFaint, lineHeight: 1.5 }}>
            To delete your account, contact support at <span style={{ color: HM.textDim }}>support@campusgaffer.app</span>.
          </p>
        </section>
      </div>
    </ScreenShell>
  );
}

function mapSaveError(e: unknown): string {
  if (e instanceof ApiError) {
    if (e.status === 422) return "Use 5-20 letters, numbers, or _ ' - .";
    if (e.status === 409) return "That name's already taken";
    if (e.status === 401) return 'Please sign in again';
  }
  return "Couldn't save, try again";
}

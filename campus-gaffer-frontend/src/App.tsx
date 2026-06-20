import { useCallback, useEffect, useRef, useState } from 'react';
import { RedirectToSignIn, SignedIn, SignedOut, SignOutButton, useAuth } from '@clerk/clerk-react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import SquadScreen from './screens/SquadScreen';
import DraftScreen from './screens/DraftScreen';
import { SQUAD_LOCK_KEY } from './lib/mockSquad';
import GWBreakdownScreen from './screens/GWBreakdownScreen';
import ProfileScreen from './screens/ProfileScreen';
import { FormationProvider } from './context/FormationContext';
import { registerTokenGetter } from './lib/auth';
import { apiFetch, ApiError } from './lib/api';

const SCREEN_TRANSITION_MS = 240;

// Server-truth squad status. `unknown` is the initial pre-fetch state and
// preserves existing localStorage-driven behaviour (no flash of empty state).
// `has` and `none` are set by `/users/me/squad` 2xx / 404 respectively.
type ServerSquadStatus = 'unknown' | 'has' | 'none';

function NoSquadCTA({ onCreate, onBack }: { onCreate: () => void; onBack: () => void }) {
  // Intentional in-place CTA — plan #61 forbids auto-redirect because users
  // who tap "Squad" expect to land on the squad surface, not have the URL
  // silently swapped.
  return (
    <div className="screen-shell" style={{ background: 'oklch(0.10 0.02 248)', color: '#fff', minHeight: '100vh' }}>
      <div className="screen-topbar" style={{ background: 'oklch(0.10 0.02 248)' }}>
        <button type="button" aria-label="Back" onClick={onBack} className="icon-btn" style={{ borderColor: 'oklch(0.28 0.04 248)', color: '#fff' }}>
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M9 2L4 7l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </button>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)', padding: '0 24px' }}>
        <div style={{ width: '100%', maxWidth: 380, padding: 24, borderRadius: 16, background: 'oklch(0.17 0.03 248)', border: '1px solid oklch(0.28 0.04 248)' }}>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 800, fontSize: 22, color: '#fff', letterSpacing: '-0.02em', marginBottom: 8 }}>You haven't drafted yet</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: 'rgba(235,235,245,0.65)', lineHeight: 1.6, marginBottom: 20 }}>Build your squad to see it here.</div>
          <button
            type="button"
            onClick={onCreate}
            style={{ width: '100%', height: 44, borderRadius: 12, border: '1px solid oklch(0.82 0.19 142)', background: 'oklch(0.82 0.19 142 / 0.12)', color: 'oklch(0.82 0.19 142)', fontFamily: "'Bricolage Grotesque', sans-serif", fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
          >
            Create squad
          </button>
        </div>
      </div>
    </div>
  );
}

function SquadRoute({ onBack }: { onBack: () => void }) {
  const [squadMode, setSquadMode] = useState<'draft' | 'locked'>(() => {
    if (typeof window === 'undefined') return 'draft';
    return window.localStorage.getItem(SQUAD_LOCK_KEY) === '1' ? 'locked' : 'draft';
  });
  const [serverStatus, setServerStatus] = useState<ServerSquadStatus>('unknown');
  const [squadTransitioning, setSquadTransitioning] = useState(false);
  const squadTransitionTimerRef = useRef<number | null>(null);

  // Hit the server to learn whether this user actually has a squad. 404 is
  // the canonical "fresh signed-in user" signal — fall back to the CTA card
  // rather than the mock-data fallback path inside SquadScreen.
  useEffect(() => {
    const ctrl = new AbortController();
    apiFetch<{ squad_id: string }>('/users/me/squad', { signal: ctrl.signal })
      .then(() => setServerStatus('has'))
      .catch((err) => {
        if (err instanceof DOMException && err.name === 'AbortError') return;
        if (err instanceof ApiError && err.status === 404) {
          setServerStatus('none');
          return;
        }
        // Non-404 (network, 5xx): leave at 'unknown' so we render the existing
        // localStorage-driven flow rather than wrongly accusing the user of
        // having no squad.
      });
    return () => ctrl.abort();
  }, []);

  useEffect(() => () => {
    if (typeof window !== 'undefined' && squadTransitionTimerRef.current !== null) {
      window.clearTimeout(squadTransitionTimerRef.current);
    }
  }, []);

  const confirmSquadLock = useCallback(() => {
    if (typeof window !== 'undefined' && squadTransitionTimerRef.current !== null) {
      window.clearTimeout(squadTransitionTimerRef.current);
      squadTransitionTimerRef.current = null;
    }
    setSquadMode('locked');
    setSquadTransitioning(true);
    if (typeof window !== 'undefined') {
      squadTransitionTimerRef.current = window.setTimeout(() => {
        setSquadTransitioning(false);
        squadTransitionTimerRef.current = null;
      }, SCREEN_TRANSITION_MS);
    } else {
      setSquadTransitioning(false);
    }
  }, []);

  if (squadTransitioning) {
    return (
      <>
        <div className="app-screen app-screen--leaving" style={{ zIndex: 1 }}>
          <DraftScreen onBack={onBack} onConfirm={confirmSquadLock} />
        </div>
        <div className="app-screen app-screen--entering" style={{ zIndex: 2 }}>
          <SquadScreen onBack={onBack} />
        </div>
      </>
    );
  }

  // Server says no squad → CTA card (button flips into draft mode in-place).
  // `squadMode === 'locked'` from a stale localStorage flag is overridden by
  // the server truth — the local mock data isn't yours.
  if (serverStatus === 'none') {
    return <NoSquadCTA onCreate={() => setSquadMode('draft')} onBack={onBack} />;
  }

  return squadMode === 'locked'
    ? <SquadScreen onBack={onBack} />
    : <DraftScreen onBack={onBack} onConfirm={confirmSquadLock} />;
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoaded, isSignedIn, getToken } = useAuth();

  useEffect(() => {
    registerTokenGetter(isSignedIn ? () => getToken() : null);
    return () => registerTokenGetter(null);
  }, [getToken, isSignedIn]);

  const onDebugLogout = useCallback(() => {
    navigate('/login', { replace: true });
  }, [navigate]);

  const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;
  if (!clerkPublishableKey) {
    return (
      <div style={{ padding: 24, color: '#fff', background: '#10151f', minHeight: '100vh', fontFamily: "'JetBrains Mono', monospace" }}>
        Missing `VITE_CLERK_PUBLISHABLE_KEY`.
      </div>
    );
  }

  if (!isLoaded) {
    return null;
  }

  return (
    <FormationProvider>
      <div className="app-stage">
        <div className="app-screen app-screen--active">
          <Routes>
            <Route path="/" element={<Navigate to={isSignedIn ? '/home' : '/login'} replace />} />
            <Route
              path="/login"
              element={isSignedIn ? <Navigate to="/home" replace /> : <LoginScreen />}
            />
            <Route
              path="/home"
              element={
                <SignedIn>
                  <HomeScreen
                    onNavigate={(target) => {
                      if (target === 'squad') navigate('/squad');
                      if (target === 'leaderboard') navigate('/leaderboard');
                      if (target === 'breakdown') navigate('/breakdown');
                      if (target === 'profile') navigate('/profile');
                    }}
                  />
                </SignedIn>
              }
            />
            <Route
              path="/squad"
              element={<SignedIn><SquadRoute onBack={() => navigate('/home')} /></SignedIn>}
            />
            <Route
              path="/leaderboard"
              element={<SignedIn><LeaderboardScreen onBack={() => navigate('/home')} /></SignedIn>}
            />
            <Route
              path="/breakdown"
              element={<SignedIn><GWBreakdownScreen onBack={() => navigate('/home')} /></SignedIn>}
            />
            <Route
              path="/profile"
              element={<SignedIn><ProfileScreen /></SignedIn>}
            />
            <Route path="*" element={<Navigate to={isSignedIn ? '/home' : '/login'} replace />} />
          </Routes>
        </div>
        <SignedOut>
          {location.pathname !== '/login' ? <RedirectToSignIn /> : null}
        </SignedOut>
        {isSignedIn && location.pathname !== '/login' && (
          <SignOutButton>
            <button
              type="button"
              onClick={onDebugLogout}
              style={{
                position: 'absolute',
                right: 10,
                bottom: 10,
                zIndex: 9999,
                border: '1px solid rgba(255,255,255,0.18)',
                background: 'rgba(6, 8, 16, 0.86)',
                color: 'rgba(235,235,245,0.85)',
                borderRadius: 10,
                padding: '8px 10px',
                fontSize: 11,
                fontFamily: "'JetBrains Mono', monospace",
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
              }}
            >
              Sign Out
            </button>
          </SignOutButton>
        )}
      </div>
    </FormationProvider>
  );
}

export default App;

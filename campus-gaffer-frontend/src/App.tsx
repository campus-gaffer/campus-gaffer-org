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
import { FormationProvider } from './context/FormationContext';
import { USER_ID_KEY } from './lib/mockSquad';
import { registerTokenGetter } from './lib/auth';

const SCREEN_TRANSITION_MS = 240;

function SquadRoute({ onBack }: { onBack: () => void }) {
  const [squadMode, setSquadMode] = useState<'draft' | 'locked'>(() => {
    if (typeof window === 'undefined') return 'draft';
    return window.localStorage.getItem(SQUAD_LOCK_KEY) === '1' ? 'locked' : 'draft';
  });
  const [squadTransitioning, setSquadTransitioning] = useState(false);
  const squadTransitionTimerRef = useRef<number | null>(null);

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

  return squadMode === 'locked'
    ? <SquadScreen onBack={onBack} />
    : <DraftScreen onBack={onBack} onConfirm={confirmSquadLock} />;
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isLoaded, isSignedIn, userId, getToken } = useAuth();

  useEffect(() => {
    registerTokenGetter(isSignedIn ? () => getToken() : null);
    return () => registerTokenGetter(null);
  }, [getToken, isSignedIn]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isSignedIn && userId) {
      window.localStorage.setItem(USER_ID_KEY, userId);
      return;
    }
    window.localStorage.removeItem(USER_ID_KEY);
  }, [isSignedIn, userId]);

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

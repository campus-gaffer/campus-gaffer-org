import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import SquadScreen from './screens/SquadScreen';
import DraftScreen from './screens/DraftScreen';
import { SQUAD_LOCK_KEY } from './lib/mockSquad';
import GWBreakdownScreen from './screens/GWBreakdownScreen';
import { FormationProvider } from './context/FormationContext';

const AUTH_STORAGE_KEY = 'campus-gaffer-auth';
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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(AUTH_STORAGE_KEY) === '1';
  });

  const onLogin = useCallback(() => {
    setIsAuthenticated(true);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(AUTH_STORAGE_KEY, '1');
    }
    navigate('/home', { replace: true });
  }, [navigate]);

  const onDebugLogout = useCallback(() => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    navigate('/login', { replace: true });
  }, [navigate]);

  const showDebugLogout = useMemo(() => {
    const flag = (import.meta.env.VITE_SHOW_DEBUG_LOGOUT as string | undefined) || 'true';
    return flag !== 'false';
  }, []);

  return (
    <FormationProvider>
      <div className="app-stage">
        <div className="app-screen app-screen--active">
          <Routes>
            <Route path="/" element={<Navigate to={isAuthenticated ? '/home' : '/login'} replace />} />
            <Route
              path="/login"
              element={isAuthenticated ? <Navigate to="/home" replace /> : <LoginScreen onLogin={onLogin} />}
            />
            <Route
              path="/home"
              element={isAuthenticated ? (
                <HomeScreen
                  onNavigate={(target) => {
                    if (target === 'squad') navigate('/squad');
                    if (target === 'leaderboard') navigate('/leaderboard');
                    if (target === 'breakdown') navigate('/breakdown');
                  }}
                />
              ) : <Navigate to="/login" replace />}
            />
            <Route
              path="/squad"
              element={isAuthenticated ? <SquadRoute onBack={() => navigate('/home')} /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/leaderboard"
              element={isAuthenticated ? <LeaderboardScreen onBack={() => navigate('/home')} /> : <Navigate to="/login" replace />}
            />
            <Route
              path="/breakdown"
              element={isAuthenticated ? <GWBreakdownScreen onBack={() => navigate('/home')} /> : <Navigate to="/login" replace />}
            />
            <Route path="*" element={<Navigate to={isAuthenticated ? '/home' : '/login'} replace />} />
          </Routes>
        </div>
        {isAuthenticated && location.pathname !== '/login' && showDebugLogout && (
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
            Debug Logout
          </button>
        )}
      </div>
    </FormationProvider>
  );
}

export default App;

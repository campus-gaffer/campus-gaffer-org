import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import SquadScreen from './screens/SquadScreen';
import DraftScreen from './screens/DraftScreen';
import { SQUAD_LOCK_KEY } from './lib/mockSquad';
import GWBreakdownScreen from './screens/GWBreakdownScreen';
import { FormationProvider } from './context/FormationContext';

type Screen = 'login' | 'home' | 'squad' | 'leaderboard' | 'breakdown';
const AUTH_STORAGE_KEY = 'campus-gaffer-auth';
const SCREEN_TRANSITION_MS = 240;

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(AUTH_STORAGE_KEY) === '1';
  });
  const [screen, setScreen] = useState<Screen>(() => (isAuthenticated ? 'home' : 'login'));
  const [transition, setTransition] = useState<{ from: Screen; to: Screen } | null>(null);
  const [squadMode, setSquadMode] = useState<'draft' | 'locked'>(() => {
    if (typeof window === 'undefined') return 'draft';
    return window.localStorage.getItem(SQUAD_LOCK_KEY) === '1' ? 'locked' : 'draft';
  });
  const [squadTransitioning, setSquadTransitioning] = useState(false);
  const transitionTimerRef = useRef<number | null>(null);
  const squadTransitionTimerRef = useRef<number | null>(null);

  const onLogin = useCallback(() => {
    setIsAuthenticated(true);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(AUTH_STORAGE_KEY, '1');
    }
    setScreen('home');
  }, []);

  const onDebugLogout = useCallback(() => {
    setIsAuthenticated(false);
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    setScreen('login');
  }, []);

  const navigateTo = useCallback((next: Screen) => {
    if (next === screen || transition) return;
    if (typeof window !== 'undefined' && transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }
    setTransition({ from: screen, to: next });
    if (typeof window !== 'undefined') {
      transitionTimerRef.current = window.setTimeout(() => {
        setScreen(next);
        setTransition(null);
        transitionTimerRef.current = null;
      }, SCREEN_TRANSITION_MS);
    } else {
      setScreen(next);
      setTransition(null);
    }
  }, [screen, transition]);

  const openSquad = useCallback(() => {
    if (typeof window !== 'undefined') {
      setSquadMode(window.localStorage.getItem(SQUAD_LOCK_KEY) === '1' ? 'locked' : 'draft');
    } else {
      setSquadMode('draft');
    }
    navigateTo('squad');
  }, [navigateTo]);

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

  useEffect(() => () => {
    if (typeof window !== 'undefined' && transitionTimerRef.current !== null) {
      window.clearTimeout(transitionTimerRef.current);
    }
    if (typeof window !== 'undefined' && squadTransitionTimerRef.current !== null) {
      window.clearTimeout(squadTransitionTimerRef.current);
    }
  }, []);

  const renderScreen = useCallback((route: Screen) => {
    if (route === 'login') return <LoginScreen onLogin={onLogin} />;
    if (route === 'home') return <HomeScreen onNavigate={(target) => (target === 'squad' ? openSquad() : navigateTo(target))} />;
    if (route === 'squad') {
      if (squadTransitioning) {
        return (
          <>
            <div className="app-screen app-screen--leaving" style={{ zIndex: 1 }}>
              <DraftScreen onBack={() => navigateTo('home')} onConfirm={confirmSquadLock} />
            </div>
            <div className="app-screen app-screen--entering" style={{ zIndex: 2 }}>
              <SquadScreen onBack={() => navigateTo('home')} />
            </div>
          </>
        );
      }
      return squadMode === 'locked'
        ? <SquadScreen onBack={() => navigateTo('home')} />
        : <DraftScreen onBack={() => navigateTo('home')} onConfirm={confirmSquadLock} />;
    }
    if (route === 'leaderboard') return <LeaderboardScreen onBack={() => navigateTo('home')} />;
    return <GWBreakdownScreen onBack={() => navigateTo('home')} />;
  }, [confirmSquadLock, navigateTo, onLogin, openSquad, squadMode, squadTransitioning]);

  const showDebugLogout = useMemo(() => {
    const flag = (import.meta.env.VITE_SHOW_DEBUG_LOGOUT as string | undefined) || 'true';
    return flag !== 'false';
  }, []);

  return (
    <FormationProvider>
      <div className="app-stage">
        {transition ? (
          <>
            <div className="app-screen app-screen--leaving">
              {renderScreen(transition.from)}
            </div>
            <div className="app-screen app-screen--entering">
              {renderScreen(transition.to)}
            </div>
          </>
        ) : (
          <div className="app-screen app-screen--active">
            {renderScreen(screen)}
          </div>
        )}
        {isAuthenticated && showDebugLogout && (
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

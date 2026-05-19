import { useState } from 'react';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import LeaderboardScreen from './screens/LeaderboardScreen';
import SquadScreen from './screens/SquadScreen';
import GWBreakdownScreen from './screens/GWBreakdownScreen';

type Screen = 'login' | 'home' | 'squad' | 'leaderboard' | 'breakdown';

function App() {
  const [screen, setScreen] = useState<Screen>('login');

  return (
    <div style={{
      width: 390,
      height: 844,
      overflow: 'hidden',
      borderRadius: 40,
      boxShadow: '0 40px 80px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.05)',
      position: 'relative',
      flexShrink: 0,
    }}>
      {screen === 'login' && <LoginScreen onLogin={() => setScreen('home')} />}
      {screen === 'home' && (
        <HomeScreen onNavigate={(s) => setScreen(s)} />
      )}
      {screen === 'squad' && <SquadScreen onBack={() => setScreen('home')} />}
      {screen === 'leaderboard' && <LeaderboardScreen onBack={() => setScreen('home')} />}
      {screen === 'breakdown' && <GWBreakdownScreen onBack={() => setScreen('home')} />}
    </div>
  );
}

export default App;

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
      width: '100%',
      height: '100dvh',
      overflow: 'hidden',
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

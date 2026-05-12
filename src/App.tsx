import { useState } from 'react';
import Login from './components/Login';
import RoleSelection from './components/RoleSelection';
import GameHub from './components/GameHub';
import { useGameStore } from './store/gameStore';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const role = useGameStore((state) => state.role);

  if (!isAuthenticated) {
    return <Login onLogin={() => setIsAuthenticated(true)} />;
  }

  if (!role) {
    return <RoleSelection />;
  }

  return <GameHub />;
}

export default App;

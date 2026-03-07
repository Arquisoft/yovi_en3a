import { useState } from 'react';
import './App.css'
import RegisterForm from './RegisterForm';
import LoginForm from './LoginForm';
import Landing from './Landing';
import MenuView from './MenuView';

type AuthScreen = 'landing' | 'login' | 'register' | 'menu';

function App() {
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('menu');
  const [gameState, setGameState] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const handlePlay = async () => {
  setLoading(true);
  setError(null);
  try {
    const res = await fetch(`${API_URL}/api/gamey/play`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        layout: [[0, 0], [0, 0]],
        size: 2,
        botId: 'random_bot'
      })
    });
    const data = await res.json();
    setGameState(data);
  } catch (err) {
    setError('Error al conectar con el servidor');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="App">

      {currentScreen === 'landing' && (
        <Landing
          onSelectLogin={() => setCurrentScreen('login')}
          onSelectRegister={() => setCurrentScreen('register')}
        />
      )}

      {currentScreen === 'login' && (
        <LoginForm onSwitchToRegister={() => setCurrentScreen('register')}
          onLoginSuccess={() => setCurrentScreen('menu')}
        />
      )}

      {currentScreen === 'register' && (
        <RegisterForm onSwitchToLogin={() => setCurrentScreen('login')} />
      )}

      {currentScreen === 'menu' && (
        <MenuView onLogout={() => setCurrentScreen('landing')} />
      )}

      <div style={{ marginTop: '20px' }}>
        <button onClick={handlePlay} disabled={loading}>
          {loading ? 'Cargando...' : 'Jugar'}
        </button>
        {error && <p style={{ color: 'red' }}>{error}</p>}
        {gameState && (
          <pre style={{ textAlign: 'left', marginTop: '10px' }}>
            {JSON.stringify(gameState, null, 2)}
          </pre>
        )}
      </div>

    </div>
  );
}

export default App;
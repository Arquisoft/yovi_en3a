import { useEffect, useState } from 'react';
import './App.css'
import RegisterForm from './RegisterForm';
import LoginForm from './LoginForm';
import Landing from './Landing';

type AuthScreen = 'landing' | 'login' | 'register';

function App() {
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('landing');
  const [status, setStatus] = useState<string>('Cargando...');

  useEffect(() => {
    fetch('http://4.233.138.159:4000/status')
      .then(res => res.text())
      .then(data => setStatus(data))
      .catch(err => setStatus(`Error: ${err.message}`));
  }, []);

  const handleBackToLanding = () => {
    setCurrentScreen('landing');
  };

  return (
    <div className="App">
      <h2>Welcome to the Software Arquitecture 2025-2026 course</h2>
      <p>{"Server status: " + status}</p>

      {currentScreen === 'landing' && (
        <Landing 
          onSelectLogin={() => setCurrentScreen('login')}
          onSelectRegister={() => setCurrentScreen('register')}
        />
      )}

      {currentScreen === 'login' && (
        <LoginForm onBack={handleBackToLanding} />
      )}

      {currentScreen === 'register' && (
        <RegisterForm onBack={handleBackToLanding} />
      )}
    </div>
  );
}

export default App;
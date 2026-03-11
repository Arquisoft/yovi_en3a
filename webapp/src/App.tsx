import {useState } from 'react';
import './App.css'
import RegisterForm from './RegisterForm';
import LoginForm from './LoginForm';
import Landing from './Landing';
import MenuView from './MenuView';

type AuthScreen = 'landing' | 'login' | 'register' | 'menu';

function App() {
  const [currentScreen, setCurrentScreen] = useState<AuthScreen>('landing');
  // Para probar el menu sin el login, deberia de estar comentado y la linea superior descomentada
  //const [currentScreen, setCurrentScreen] = useState<AuthScreen>('menu');

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

    </div>
  );
}

export default App;
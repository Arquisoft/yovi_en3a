import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './Landing';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import MenuView from './MenuView';
import GameSelect from './game/GameSelect';
import './App.css';
import GameBoard from './game/GameBoard';
import { GameScreen } from './GameScreen';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          {/* Ruta inicial */}
          <Route path="/" element={<Landing />} />

          {/* Autenticación */}
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />

          {/* Dashboard y Selección */}
          <Route path="/menu" element={<MenuView />} />
          <Route path="/select-game" element={<GameSelect onBack={() => { }} />} />


          {/*Panel de juego */}
          <Route path="/game/:gameId/:size" element={<GameScreen />} />

          {/* Redirección por defecto si la ruta no existe */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
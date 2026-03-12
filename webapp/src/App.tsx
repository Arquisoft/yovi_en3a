import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './Landing';
import LoginForm from './LoginForm';
import RegisterForm from './RegisterForm';
import MenuView from './MenuView';
import GameSelect from './game/GameSelect';
import './App.css';

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

          {/* Pantalla de juego dinámica */}
          <Route path="/game/:id" element={<div>Pantalla de Juego (ID: recuperable vía useParams)</div>} />

          {/* Redirección por defecto si la ruta no existe */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
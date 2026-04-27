import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Landing from './Landing';
import LoginForm from './RegisterUsers/LoginForm';
import RegisterForm from './RegisterUsers/RegisterForm';
import MenuView from './MenuView';
import GameSelect from './Game/GameSelect';
import HowToPlay from "./HowToPlay";
import './App.css';
import { GameScreen } from './Game/GameScreen';
import StatsView from './UsersView/StatsView';
import RankingView from './UsersView/RankingView';
import ProtectedRoute from './ProtectRoutes';
import MatchHistoryView from './UsersView/MatchHistoryView';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Routes>
          {/* Rutas públicas */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LoginForm />} />
          <Route path="/register" element={<RegisterForm />} />

          {/* Rutas protegidas */}
          <Route path="/menu" element={
            <ProtectedRoute><MenuView /></ProtectedRoute>
          } />
          <Route path="/select-game" element={
            <ProtectedRoute><GameSelect onBack={() => { }} mode="bot" /></ProtectedRoute>
          } />
          <Route path="/multiplayer" element={
            <ProtectedRoute><GameSelect onBack={() => { }} mode="multiplayer" /></ProtectedRoute>
          } />
          <Route path="/how-to-play" element={
            <ProtectedRoute><HowToPlay /></ProtectedRoute>
          } />
          <Route path="/game/:gameId/:size/:gameType" element={
            <ProtectedRoute><GameScreen /></ProtectedRoute>
          } />
          <Route path="/stats" element={
            <ProtectedRoute><StatsView /></ProtectedRoute>
          } />
          <Route path="/ranking" element={
            <ProtectedRoute><RankingView /></ProtectedRoute>
          } />
          <Route path="/match-history" element={
            <ProtectedRoute><MatchHistoryView /></ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import App from "./App";
import { GameScreen } from "./GameScreen";
import GameSelect from "./game/GameSelect";
import HowToPlay from "./HowToPlay";
import RegisterForm from "./RegisterForm";
import LoginForm from "./LoginForm";
import Landing from "./Landing";


function GameSelectWrapper() {
  const navigate = useNavigate();
  return <GameSelect onBack={() => navigate(-1)} />;
}

export default function RoutesWrapper() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/register" element={<RegisterForm />} />
        <Route path="/menu" element={<App />} />
        <Route path="/how-to-play" element={<HowToPlay />} />
        <Route path="/select-game" element={<GameSelectWrapper />} />
        <Route path="/game/:gameId" element={<GameScreen />} />
      </Routes>
    </BrowserRouter>
  );
}
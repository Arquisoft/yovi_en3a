import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import App from "./App";
import { GameScreen } from "./GameScreen";
import GameSelect from "./game/GameSelect";
import HowToPlay from "./HowToPlay";


function GameSelectWrapper() {
  const navigate = useNavigate();
  return <GameSelect onBack={() => navigate(-1)} />;
}

export default function RoutesWrapper() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/how-to-play" element={<HowToPlay />} />
        <Route path="/select-game" element={<GameSelectWrapper />} />
        <Route path="/game/:gameId" element={<GameScreen />} />
      </Routes>
    </BrowserRouter>
  );
}
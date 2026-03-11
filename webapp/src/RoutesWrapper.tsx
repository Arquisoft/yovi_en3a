import { BrowserRouter, Routes, Route, useNavigate, Outlet } from "react-router-dom";
import App from "./App";
import { GameScreen } from "./GameScreen";
import GameSelect from "./game/GameSelect";
import NavBar from "./game/NavBar";
import MenuView from "./MenuView";

function AuthenticatedLayout({ onLogout }: { onLogout: () => void }) {
    return (
        <div style={{ paddingTop: "52px" }}>
            <NavBar onLogout={onLogout} />
            <Outlet />
        </div>
    );
}

function GameSelectWrapper() {
    const navigate = useNavigate();
    return <GameSelect onBack={() => navigate(-1)} />;
}

export default function RoutesWrapper({ onLogout }: { onLogout?: () => void }) {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<App />} />

                <Route element={<AuthenticatedLayout onLogout={onLogout ?? (() => window.location.href = "/")} />}>
                    <Route path="/select-game" element={<GameSelectWrapper />} />
                    <Route path="/game/:gameId" element={<GameScreen />} />
                </Route>
                <Route path="/menu" element={<MenuView onLogout={onLogout ?? (() => window.location.href = "/")} />} />
            </Routes>
        </BrowserRouter>
    );
}
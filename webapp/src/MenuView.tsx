import React from "react";
import { useNavigate } from "react-router-dom";
import HexBackground from "./BackgroundComponents/HexBackGround";
import "./game/GameSelect.css";
import useTickSound from "./Hooks/useTickSound";


const MenuView: React.FC = () => {
    const playTick = useTickSound();
    const loading = false;
    const navigate = useNavigate();

    const handleViewStats = async () => {
        try {
            const userId = localStorage.getItem('userId');
            if (!userId) throw new Error("No user found");

            // Simulamos un pequeño retraso para que el usuario vea el feedback
            await new Promise(resolve => setTimeout(resolve, 500));

            navigate("/stats");
        } catch (err) {
            console.error("Error navigating to stats:", err);
        }
    };

    const options = [
        { label: "Play vs Bot", icon: "🤖", onClick: () => navigate("/select-game") },
        { label: "Local Multiplayer", icon: "⚔️", path: "/multiplayer" },
        {
            label: "History & Stats",
            icon: "📊",
            onClick: handleViewStats, // Ahora usa la función asíncrona
            loadingText: "Fetching stats..."
        },
        {
            label: "Global Ranking",
            icon: "🏆",
            path: "/ranking"
        },
        { label: "How to Play", icon: "📖", path: "/how-to-play" },
    ];

    return (
        <div className="game-select-overlay">
            <HexBackground opacity={0.7} />
            <div className="game-select-container" style={{ maxWidth: "20rem" }}>
                <div className="game-select-header">
                    <h1 className="game-select-title">Game Y</h1>
                    <p className="game-select-subtitle">Choose an option to continue</p>
                </div>

                <div className="variants-list">
                    {options.map((item) => (
                        <button
                            key={item.label}
                            onClick={() => { playTick(); item.onClick ? item.onClick() : navigate(item.path!); }}
                            disabled={loading && item.label === "Play vs Bot"}
                            className="mode-card"
                        >
                            <span className="mode-card-icon">{item.icon}</span>
                            <div className="mode-card-info">
                                <span className="mode-card-label">
                                    {loading && item.label === "Play vs Bot" ? "Creating game..." : item.label}
                                </span>
                            </div>
                            <span className="mode-card-arrow">→</span>
                        </button>
                    ))}

                    <div className="variant-divider">
                        <div className="divider-line" />
                    </div>

                    <button
                        className="mode-card"
                        onClick={() => {
                            playTick();
                            localStorage.removeItem('token');
                            localStorage.removeItem('userId');
                            navigate('/');
                        }}
                        style={{ borderColor: "rgba(239,68,68,0.2)", color: "#ef4444" }}
                        onMouseEnter={e => (e.currentTarget.style.borderColor = "rgba(239,68,68,0.5)")}
                        onMouseLeave={e => (e.currentTarget.style.borderColor = "rgba(239,68,68,0.2)")}
                    >
                        <span className="mode-card-icon">⏻</span>
                        <div className="mode-card-info">
                            <span className="mode-card-label" style={{ color: "#ef4444" }}>Log Out</span>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default MenuView;
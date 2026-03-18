import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import HexBackground from "./HexBackGround";
import "./game/GameSelect.css";
import { motion } from "framer-motion";


const MenuView: React.FC = () => {
    const [hovered, setHovered] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const gatewayUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

    const handlePlayVsBot = async () => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${gatewayUrl}/api/game-manager/create/standard`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ botId: 'random_bot', boardSize: 7 })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            navigate(`/game/${data.gameId}`); // pasamos el gameId por la URL
        } catch (err) {
            console.error("Error creating game:", err);
        } finally {
            setLoading(false);
        }
    };

    const options = [
        { label: "Play vs Bot", icon: "🤖", onClick: () => navigate("/select-game") },
        { label: "Multiplayer", icon: "⚔️", path: "/multiplayer" },
        { label: "History & Stats", icon: "📊", path: "/history" },
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
                        onClick={() => item.onClick ? item.onClick() : navigate(item.path!)}
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
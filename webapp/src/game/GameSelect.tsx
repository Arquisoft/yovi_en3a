import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

interface GameSelectProps {
    onBack: () => void;
}

const GAMES = [
    { id: "standard", label: "Standard", description: "Classic rules, no surprises" },
    { id: "master", label: "Master", description: "For experienced players" },
    { id: "fortune", label: "Fortune", description: "Luck plays a role" },
    { id: "tabu", label: "Tabu", description: "Some moves are forbidden" },
    { id: "holey", label: "Holey", description: "The board has holes" },
    { id: "whynot", label: "Why Not", description: "Anything goes" },
    { id: "poly", label: "Poly", description: "Multiple boards at once" },
];

const GameSelect: React.FC<GameSelectProps> = ({ onBack }) => {
    const [hovered, setHovered] = useState<string | null>(null);
    const [loading, setLoading] = useState<string | null>(null);
    const navigate = useNavigate();

    const gatewayUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

    const handleSelect = async (gameId: string) => {
        setLoading(gameId);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${gatewayUrl}/api/game-manager/create/${gameId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ botId: "random_bot", boardSize: 7 }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            navigate(`/game/${data.gameId}`);
        } catch (err) {
            console.error("Error creating game:", err);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 p-6">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <button
                        onClick={onBack}
                        style={{ color: "#6b7280", fontSize: "0.85rem", background: "none", border: "none", cursor: "pointer", marginBottom: "1rem" }}
                    >
                        ← Back
                    </button>
                    <h1 className="text-4xl font-bold text-white mb-1">Select Mode</h1>
                    <p className="text-gray-400 text-sm">Choose a game type to play vs Bot</p>
                </div>

                <div className="flex flex-col gap-3">
                    {GAMES.map((game) => (
                        <button
                            key={game.id}
                            onMouseEnter={() => setHovered(game.id)}
                            onMouseLeave={() => setHovered(null)}
                            onClick={() => handleSelect(game.id)}
                            disabled={loading !== null}
                            className="flex items-center gap-3 w-full px-5 py-4 rounded-lg text-left transition-all duration-150"
                            style={{
                                background: hovered === game.id ? "#1e293b" : "#111827",
                                border: `1px solid ${hovered === game.id ? "#6366f1" : "#1f2937"}`,
                                color: hovered === game.id ? "#fff" : "#9ca3af",
                                opacity: loading !== null && loading !== game.id ? 0.5 : 1,
                                cursor: loading !== null ? "not-allowed" : "pointer",
                            }}
                        >
                            <div className="flex flex-col">
                                <span className="font-medium text-base">
                                    {loading === game.id ? "Creating..." : game.label}
                                </span>
                                <span style={{ fontSize: "0.75rem", color: hovered === game.id ? "#94a3b8" : "#4b5563" }}>
                                    {game.description}
                                </span>
                            </div>
                            <span className="ml-auto text-xs opacity-50">
                                {hovered === game.id ? "→" : ""}
                            </span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GameSelect;
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./GameSelect.css";

interface GameSelectProps {
    onBack: () => void;
}

const VARIANTES = [
    { id: "master", label: "Master", description: "For experienced players" },
    { id: "fortune", label: "Fortune", description: "Luck plays a role" },
    { id: "tabu", label: "Tabu", description: "Some moves are forbidden" },
    { id: "holey", label: "Holey", description: "The board has holes" },
    { id: "whynot", label: "Why Not", description: "Anything goes" },
    { id: "poly", label: "Poly", description: "Multiple boards at once" },
];

const GameSelect: React.FC<GameSelectProps> = ({ onBack }) => {
    const [loading, setLoading] = useState<string | null>(null);
    const [isStandardOpen, setIsStandardOpen] = useState(false);

    const [boardSize, setBoardSize] = useState(7);
    const [difficulty, setDifficulty] = useState("random_bot");

    const navigate = useNavigate();
    const gatewayUrl = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

    const handleSelect = async (gameId: string, size: number = 7, bot: string = "random_bot") => {
        setLoading(gameId);
        try {
            const token = localStorage.getItem("token");
            const res = await fetch(`${gatewayUrl}/api/game-manager/create/${gameId}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ botId: bot, boardSize: size }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            navigate(`/game/${data.gameId}/${size}`);
        } catch (err) {
            console.error("Error creating game:", err);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="game-select-overlay">
            <div className="game-select-container">

                <header className="text-center mb-8">
                    <button onClick={onBack} className="btn-back">← Back</button>
                    <h1 className="text-4xl font-bold text-white mb-1">Select Mode</h1>
                    <p className="text-gray-400 text-sm">Choose a game type to play vs Bot</p>
                </header>

                {/* MODO STANDARD */}
                <section className="flex flex-col mb-2">
                    <button
                        onClick={() => setIsStandardOpen(!isStandardOpen)}
                        className={`mode-card ${isStandardOpen ? 'mode-card-active' : ''}`}
                    >
                        <span className="text-2xl">🏆</span>
                        <div className="flex flex-col">
                            <span className="font-bold text-lg">Standard Mode</span>
                            <span className="text-xs text-gray-500">The classic hex experience.</span>
                        </div>
                        <span className="ml-auto text-gray-600">{isStandardOpen ? "▲" : "▼"}</span>
                    </button>

                    {isStandardOpen && (
                        <div className="config-panel">
                            <div>
                                <label className="config-label">Board Size: {boardSize}x{boardSize}</label>
                                <div className="size-selector-grid">
                                    {[5, 7, 9, 11].map(s => (
                                        <button
                                            key={s}
                                            onClick={() => setBoardSize(s)}
                                            className={`size-option-btn ${boardSize === s ? 'is-selected' : ''}`}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="config-label">Difficulty</label>
                                <select
                                    value={difficulty}
                                    onChange={(e) => setDifficulty(e.target.value)}
                                    className="difficulty-dropdown"
                                >
                                    <option value="random_bot">Easy </option>
                                    <option value="beginner_bot">Medium </option>
                                    <option value="medium_bot">Hard </option>
                                </select>
                            </div>

                            <button
                                onClick={() => handleSelect("standard", boardSize, difficulty)}
                                disabled={loading !== null}
                                className="btn-primary-start"
                            >
                                {loading === "standard" ? "Creating..." : "Start Standard"}
                            </button>
                        </div>
                    )}
                </section>

                <div className="variant-divider">
                    <div className="divider-line"></div>
                    <span className="divider-text">Variants</span>
                    <div className="divider-line"></div>
                </div>

                {/* LISTA DE VARIANTES */}
                <div className="flex flex-col gap-3">
                    {VARIANTES.map((game) => (
                        <button
                            key={game.id}
                            onClick={() => handleSelect(game.id)}
                            disabled={loading !== null}
                            className="mode-card"
                        >
                            <div className="flex flex-col">
                                <span className="font-bold text-gray-300">{game.label}</span>
                                <span className="text-xs text-gray-600">{game.description}</span>
                            </div>
                            <span className="ml-auto text-gray-700">→</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GameSelect;
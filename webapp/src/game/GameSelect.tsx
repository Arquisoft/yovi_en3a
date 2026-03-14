import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./GameSelect.css";

const useTickSound = () => {
    const playTick = () => {
        console.log("playTick ejecutado");
        try {
            const ctx = new AudioContext();
            console.log("ctx creado, estado:", ctx.state);
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(440, ctx.currentTime);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            osc.start();
            osc.stop(ctx.currentTime + 0.3);
        } catch(e) {
            console.error("Error:", e);
        }
    };
    return playTick;
};

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
    const playTick = useTickSound();
    const [loading, setLoading] = useState<string | null>(null);
    const [isStandardOpen, setIsStandardOpen] = useState(false);
    const [boardSize, setBoardSize] = useState(7);
    const [difficulty, setDifficulty] = useState("random_bot");

    const navigate = useNavigate();
    const gatewayUrl = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

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

                <header className="game-select-header">
                    <button onClick={() => { playTick(); onBack(); }} className="btn-back">← Back</button>
                    <h1 className="game-select-title">Select Mode</h1>
                    <p className="game-select-subtitle">Choose a game type to play vs Bot</p>
                </header>

                {/* MODO STANDARD */}
                <section className="standard-section">
                    <button
                        onClick={() => { playTick(); setIsStandardOpen(!isStandardOpen); }}
                        className={`mode-card ${isStandardOpen ? "mode-card-active" : ""}`}
                    >
                        <span className="mode-card-icon">🏆</span>
                        <div className="mode-card-info">
                            <span className="mode-card-label">Standard Mode</span>
                            <span className="mode-card-desc">The classic hex experience.</span>
                        </div>
                        <span className="mode-card-arrow">{isStandardOpen ? "▲" : "▼"}</span>
                    </button>

                    {isStandardOpen && (
                        <div className="config-panel">
                            <div>
                                <label className="config-label">Board Size: {boardSize}x{boardSize}</label>
                                <div className="size-selector-grid">
                                    {[5, 7, 9, 11].map((s) => (
                                        <button
                                            key={s}
                                            onClick={() => { playTick(); setBoardSize(s); }}
                                            className={`size-option-btn ${boardSize === s ? "is-selected" : ""}`}
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
                                    <option value="random_bot">Easy</option>
                                    <option value="beginner_bot">Medium</option>
                                    <option value="medium_bot">Hard</option>
                                </select>
                            </div>

                            <button
                                onClick={() => { playTick(); handleSelect("standard", boardSize, difficulty); }}
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
                <div className="variants-list">
                    {VARIANTES.map((game) => (
                        <button
                            key={game.id}
                            onClick={() => { playTick(); handleSelect(game.id); }}
                            disabled={loading !== null}
                            className="mode-card"
                        >
                            <div className="mode-card-info">
                                <span className="mode-card-label">{game.label}</span>
                                <span className="mode-card-desc">{game.description}</span>
                            </div>
                            <span className="mode-card-arrow">→</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GameSelect;
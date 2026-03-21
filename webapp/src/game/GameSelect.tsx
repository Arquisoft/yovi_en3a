import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./GameSelect.css";
import HexBackground from "../HexBackGround";
import { gatewayUrl } from "../lib/config";
import { motion } from "framer-motion";

const useTickSound = () => {
  const playTick = () => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.value = 523;
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } catch {
      // AudioContext not available in test environment
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

  const handleSelect = async (
    gameId: string,
    size: number = 7,
    bot: string = "random_bot"
  ) => {
    setLoading(gameId);
    try {
      const token =
        typeof localStorage !== "undefined"
          ? localStorage.getItem("token")
          : null;
      const res = await fetch(
        `${gatewayUrl}/api/game-manager/create/${gameId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ botId: bot, boardSize: size }),
        }
      );

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
      <HexBackground opacity={0.7} />
      <motion.div
          className="game-select-container"
          initial={{ opacity: 0, x: 80 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -80 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
      >
        <header className="game-select-header">
          <button
            onClick={() => {
              playTick();
              if (onBack) onBack();
              navigate("/menu");
            }}
            className="btn-back"
          >
            ← Back
          </button>
          <h1 className="game-select-title">Select Mode</h1>
          <p className="game-select-subtitle">
            Choose a game type to play vs Bot
          </p>
        </header>

        {/* STANDARD MODE */}
        <section className="standard-section">
          <button
            onClick={() => {
              playTick();
              setIsStandardOpen(!isStandardOpen);
            }}
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
                <label className="config-label">
                  Board Size: {boardSize}x{boardSize}
                </label>
                <div className="size-selector-grid">
                  {[5, 7, 9, 11].map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        playTick();
                        setBoardSize(s);
                      }}
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
                onClick={() => {
                  playTick();
                  handleSelect("standard", boardSize, difficulty);
                }}
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

        {/* VARIANTS LIST */}
        <div className="variants-list">
          {VARIANTES.map((game) => (
            <button
              key={game.id}
              onClick={() => {
                playTick();
                handleSelect(game.id);
              }}
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
      </motion.div>
    </div>
  );
};

export default GameSelect;
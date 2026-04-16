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
  { id: "master",  label: "Master",  description: "Double moves for each player",          bot: "medium_bot", configurable: true  },
  { id: "fortune", label: "Fortune", description: "Game where a dice decides who plays next", bot: "medium_bot", configurable: true  },
];

const GameSelect: React.FC<GameSelectProps> = ({ onBack }) => {
  const playTick = useTickSound();
  const [loading, setLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  // Standard
  const [isStandardOpen, setIsStandardOpen] = useState(false);
  const [standardSize, setStandardSize] = useState(7);
  const [standardDifficulty, setStandardDifficulty] = useState("random_bot");

  // Variants configurables
  const [openVariant, setOpenVariant] = useState<string | null>(null);
  const [variantSize, setVariantSize] = useState<Record<string, number>>(
    Object.fromEntries(VARIANTES.map((v) => [v.id, 7]))
  );
  const [variantDifficulty, setVariantDifficulty] = useState<Record<string, string>>(
    Object.fromEntries(VARIANTES.map((v) => [v.id, v.bot]))
  );

  const handleSelect = async (gameId: string, size: number = 7, bot: string = "random_bot") => {
    setLoading(gameId);
    try {
      const token =
        typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
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
      navigate(`/game/${data.gameId}/${size}/${gameId}`);
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
          <p className="game-select-subtitle">Choose a game type to play vs Bot</p>
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
                <label className="config-label">Board Size: {standardSize}x{standardSize}</label>
                <div className="size-selector-grid">
                  {[5, 7, 9, 11].map((s) => (
                    <button
                      key={s}
                      onClick={() => { playTick(); setStandardSize(s); }}
                      className={`size-option-btn ${standardSize === s ? "is-selected" : ""}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="config-label">Difficulty</label>
                <select
                  value={standardDifficulty}
                  onChange={(e) => setStandardDifficulty(e.target.value)}
                  className="difficulty-dropdown"
                >
                  <option value="random_bot">Easy</option>
                  <option value="beginner_bot">Medium</option>
                  <option value="medium_bot">Hard</option>
                </select>
              </div>
              <button
                onClick={() => { playTick(); handleSelect("standard", standardSize, standardDifficulty); }}
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
            <section key={game.id} className="standard-section">
              <button
                onClick={() => {
                  playTick();
                  if (game.configurable) {
                    setOpenVariant(openVariant === game.id ? null : game.id);
                  } else {
                    handleSelect(game.id, 7, game.bot);
                  }
                }}
                disabled={loading !== null}
                className={`mode-card ${openVariant === game.id ? "mode-card-active" : ""}`}
              >
                <div className="mode-card-info">
                  <span className="mode-card-label">{game.label}</span>
                  <span className="mode-card-desc">{game.description}</span>
                </div>
                <span className="mode-card-arrow">
                  {game.configurable ? (openVariant === game.id ? "▲" : "▼") : "→"}
                </span>
              </button>

              {game.configurable && openVariant === game.id && (
                <div className="config-panel">
                  <div>
                    <label className="config-label">
                      Board Size: {variantSize[game.id]}x{variantSize[game.id]}
                    </label>
                    <div className="size-selector-grid">
                      {[5, 7, 9, 11].map((s) => (
                        <button
                          key={s}
                          onClick={() => {
                            playTick();
                            setVariantSize((prev) => ({ ...prev, [game.id]: s }));
                          }}
                          className={`size-option-btn ${variantSize[game.id] === s ? "is-selected" : ""}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="config-label">Difficulty</label>
                    <select
                      value={variantDifficulty[game.id]}
                      onChange={(e) =>
                        setVariantDifficulty((prev) => ({ ...prev, [game.id]: e.target.value }))
                      }
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
                      handleSelect(game.id, variantSize[game.id], variantDifficulty[game.id]);
                    }}
                    disabled={loading !== null}
                    className="btn-primary-start"
                  >
                    {loading === game.id ? "Creating..." : `Start ${game.label}`}
                  </button>
                </div>
              )}
            </section>
          ))}
        </div>

      </motion.div>
    </div>
  );
};

export default GameSelect;

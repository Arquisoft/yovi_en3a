import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./GameSelect.css";
import HexBackground from "../BackgroundComponents/HexBackGround";
import { gatewayUrl } from "../lib/config";
import { motion } from "framer-motion";
import useTickSound from "../Hooks/useTickSound";

interface GameSelectProps {
  onBack: () => void;
  mode?: "bot" | "multiplayer";
}

// hasBot: disponible para jugar contra bot
// configurable: muestra panel de tamaño + dificultad en modo bot
const VARIANTES = [
  { id: "master", label: "Master", description: "Each player places two pieces per turn", bot: "medium_bot", hasBot: true, configurable: true },
  { id: "fortune", label: "Fortune", description: "A dice decides who plays next", bot: "medium_bot", hasBot: true, configurable: true },
  { id: "pie", label: "Pie Rule", description: "A player chooses where, the other decides who goes first", bot: "random_bot", hasBot: false, configurable: false },
  { id: "tabu", label: "Tabu", description: "Forbidden to place adjacent to opponent's last move", bot: "random_bot", hasBot: false, configurable: false },
  { id: "holey", label: "Holey", description: "The board has holes where pieces cannot be placed", bot: "random_bot", hasBot: false, configurable: false },
  { id: "whynot", label: "Why Not", description: "First player to connect three edges loses", bot: "random_bot", hasBot: false, configurable: false },
];

const GameSelect: React.FC<GameSelectProps> = ({ onBack, mode = "bot" }) => {
  const playTick = useTickSound();
  const [loading, setLoading] = useState<string | null>(null);
  const navigate = useNavigate();

  // Standard (solo en modo bot)
  const [isStandardOpen, setIsStandardOpen] = useState(false);
  const [standardSize, setStandardSize] = useState(7);
  const [standardDifficulty, setStandardDifficulty] = useState("random_bot");

  // Variantes: qué panel está abierto y config por variante
  const [openVariant, setOpenVariant] = useState<string | null>(null);
  const [variantSize, setVariantSize] = useState<Record<string, number>>(
    Object.fromEntries(VARIANTES.map((v) => [v.id, 7]))
  );
  const [variantDifficulty, setVariantDifficulty] = useState<Record<string, string>>(
    Object.fromEntries(VARIANTES.map((v) => [v.id, v.bot]))
  );

  const handleSelect = async (gameId: string, size: number = 7, bot: string = "random_bot") => {
    if (gameId === "pie" && mode === "multiplayer") {
      navigate(`/game/local-${Date.now()}/${size}/pie`, {
        state: { isMultiplayer: true },
      });
      return;
    }
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
      navigate(`/game/${data.gameId}/${size}/${gameId}`, {
        state: { isMultiplayer: mode === "multiplayer" },
      });
    } catch (err) {
      console.error("Error creating game:", err);
    } finally {
      setLoading(null);
    }
  };

  // Variantes visibles según el modo
  const visibleVariantes = mode === "bot"
    ? VARIANTES.filter((v) => v.hasBot)
    : VARIANTES;

  // En multiplayer todas las variantes muestran panel (solo board size)
  const isConfigurableInMode = (v: typeof VARIANTES[0]) =>
    mode === "multiplayer" || v.configurable;

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
          <h1 className="game-select-title">
            {mode === "multiplayer" ? "Multiplayer" : "Play vs Bot"}
          </h1>
          <p className="game-select-subtitle">Choose a game type</p>
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
              {mode === "bot" && (
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
              )}
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
          {visibleVariantes.map((game) => (
            <section key={game.id} className="standard-section">
              <button
                onClick={() => {
                  playTick();
                  if (isConfigurableInMode(game)) {
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
                  {isConfigurableInMode(game) ? (openVariant === game.id ? "▲" : "▼") : "→"}
                </span>
              </button>

              {isConfigurableInMode(game) && openVariant === game.id && (
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

                  {/* Dificultad solo en modo bot */}
                  {mode === "bot" && (
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
                  )}

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

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./GameSelect.css";
import HexBackground from "../BackgroundComponents/HexBackGround";
import { gatewayUrl } from "../lib/config";
import { motion } from "framer-motion";
import useTickSound from "../hooks/useTickSound";

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
    setLoading(gameId);
    
    try {
      const token = typeof localStorage !== "undefined" ? localStorage.getItem("token") : null;
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

  const handleBackClick = () => {
    playTick();
    if (onBack) onBack();
    navigate("/menu");
  };

  const handleStandardToggle = () => {
    playTick();
    setIsStandardOpen(!isStandardOpen);
  };

  const handleSizeChange = (size: number) => {
    playTick();
    setStandardSize(size);
  };

  const handleVariantSizeChange = (gameId: string, size: number) => {
    playTick();
    setVariantSize((prev) => ({ ...prev, [gameId]: size }));
  };

  const handleVariantClick = (game: typeof VARIANTES[0]) => {
    playTick();
    
    const isConfigurable = mode === "multiplayer" || game.configurable;
    
    if (isConfigurable) {
      setOpenVariant(openVariant === game.id ? null : game.id);
    } else {
      handleSelect(game.id, 7, game.bot);
    }
  };

  // Variantes visibles según el modo
  const visibleVariantes = mode === "bot"
    ? VARIANTES.filter((v) => v.hasBot)
    : VARIANTES;

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
        <GameSelectHeader 
          onBack={handleBackClick}
          mode={mode}
        />

        <StandardSection
          isOpen={isStandardOpen}
          onToggle={handleStandardToggle}
          size={standardSize}
          onSizeChange={handleSizeChange}
          difficulty={standardDifficulty}
          onDifficultyChange={setStandardDifficulty}
          mode={mode}
          loading={loading}
          onStart={() => {
            playTick();
            handleSelect("standard", standardSize, standardDifficulty);
          }}
        />

        <VariantsDivider />

        <VariantsList
          variants={visibleVariantes}
          openVariant={openVariant}
          variantSize={variantSize}
          variantDifficulty={variantDifficulty}
          mode={mode}
          loading={loading}
          isConfigurableInMode={isConfigurableInMode}
          onVariantClick={handleVariantClick}
          onSizeChange={handleVariantSizeChange}
          onDifficultyChange={setVariantDifficulty}
          onStart={handleSelect}
          playTick={playTick}
        />
      </motion.div>
    </div>
  );
};

// ============= SUB-COMPONENTS =============

interface GameSelectHeaderProps {
  onBack: () => void;
  mode: "bot" | "multiplayer";
}

const GameSelectHeader: React.FC<GameSelectHeaderProps> = ({ onBack, mode }) => (
  <header className="game-select-header">
    <button onClick={onBack} className="btn-back">
      ← Back
    </button>
    <h1 className="game-select-title">
      {mode === "multiplayer" ? "Multiplayer" : "Play vs Bot"}
    </h1>
    <p className="game-select-subtitle">Choose a game type</p>
  </header>
);

interface StandardSectionProps {
  isOpen: boolean;
  onToggle: () => void;
  size: number;
  onSizeChange: (size: number) => void;
  difficulty: string;
  onDifficultyChange: (difficulty: string) => void;
  mode: "bot" | "multiplayer";
  loading: string | null;
  onStart: () => void;
}

const StandardSection: React.FC<StandardSectionProps> = ({
  isOpen,
  onToggle,
  size,
  onSizeChange,
  difficulty,
  onDifficultyChange,
  mode,
  loading,
  onStart,
}) => (
  <section className="standard-section">
    <button
      onClick={onToggle}
      className={`mode-card ${isOpen ? "mode-card-active" : ""}`}
    >
      <span className="mode-card-icon">🏆</span>
      <div className="mode-card-info">
        <span className="mode-card-label">Standard Mode</span>
        <span className="mode-card-desc">The classic hex experience.</span>
      </div>
      <span className="mode-card-arrow">{isOpen ? "▲" : "▼"}</span>
    </button>

    {isOpen && (
      <ConfigPanel
        size={size}
        onSizeChange={onSizeChange}
        difficulty={difficulty}
        onDifficultyChange={onDifficultyChange}
        showDifficulty={mode === "bot"}
        loading={loading === "standard"}
        onStart={onStart}
        startLabel="Start Standard"
      />
    )}
  </section>
);

interface ConfigPanelProps {
  size: number;
  onSizeChange: (size: number) => void;
  difficulty: string;
  onDifficultyChange: (difficulty: string) => void;
  showDifficulty: boolean;
  loading: boolean;
  onStart: () => void;
  startLabel: string;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({
  size,
  onSizeChange,
  difficulty,
  onDifficultyChange,
  showDifficulty,
  loading,
  onStart,
  startLabel,
}) => (
  <div className="config-panel">
    <div>
      <label className="config-label">Board Size: {size}x{size}</label>
      <div className="size-selector-grid">
        {[5, 7, 9, 11].map((s) => (
          <button
            key={s}
            onClick={() => onSizeChange(s)}
            className={`size-option-btn ${size === s ? "is-selected" : ""}`}
          >
            {s}
          </button>
        ))}
      </div>
    </div>

    {showDifficulty && (
      <div>
        <label className="config-label">Difficulty</label>
        <select
          value={difficulty}
          onChange={(e) => onDifficultyChange(e.target.value)}
          className="difficulty-dropdown"
        >
          <option value="random_bot">Easy</option>
          <option value="beginner_bot">Medium</option>
          <option value="medium_bot">Hard</option>
        </select>
      </div>
    )}

    <button
      onClick={onStart}
      disabled={loading}
      className="btn-primary-start"
    >
      {loading ? "Creating..." : startLabel}
    </button>
  </div>
);

const VariantsDivider: React.FC = () => (
  <div className="variant-divider">
    <div className="divider-line"></div>
    <span className="divider-text">Variants</span>
    <div className="divider-line"></div>
  </div>
);

interface VariantsListProps {
  variants: typeof VARIANTES;
  openVariant: string | null;
  variantSize: Record<string, number>;
  variantDifficulty: Record<string, string>;
  mode: "bot" | "multiplayer";
  loading: string | null;
  isConfigurableInMode: (v: typeof VARIANTES[0]) => boolean;
  onVariantClick: (game: typeof VARIANTES[0]) => void;
  onSizeChange: (gameId: string, size: number) => void;
  onDifficultyChange: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  onStart: (gameId: string, size: number, bot: string) => void;
  playTick: () => void;
}

const VariantsList: React.FC<VariantsListProps> = ({
  variants,
  openVariant,
  variantSize,
  variantDifficulty,
  mode,
  loading,
  isConfigurableInMode,
  onVariantClick,
  onSizeChange,
  onDifficultyChange,
  onStart,
  playTick,
}) => (
  <div className="variants-list">
    {variants.map((game) => (
      <VariantCard
        key={game.id}
        game={game}
        isOpen={openVariant === game.id}
        size={variantSize[game.id]}
        difficulty={variantDifficulty[game.id]}
        mode={mode}
        loading={loading}
        isConfigurable={isConfigurableInMode(game)}
        onVariantClick={() => onVariantClick(game)}
        onSizeChange={(size) => onSizeChange(game.id, size)}
        onDifficultyChange={(value) =>
          onDifficultyChange((prev) => ({ ...prev, [game.id]: value }))
        }
        onStart={() => {
          playTick();
          onStart(game.id, variantSize[game.id], variantDifficulty[game.id]);
        }}
      />
    ))}
  </div>
);

interface VariantCardProps {
  game: typeof VARIANTES[0];
  isOpen: boolean;
  size: number;
  difficulty: string;
  mode: "bot" | "multiplayer";
  loading: string | null;
  isConfigurable: boolean;
  onVariantClick: () => void;
  onSizeChange: (size: number) => void;
  onDifficultyChange: (difficulty: string) => void;
  onStart: () => void;
}

const VariantCard: React.FC<VariantCardProps> = ({
  game,
  isOpen,
  size,
  difficulty,
  mode,
  loading,
  isConfigurable,
  onVariantClick,
  onSizeChange,
  onDifficultyChange,
  onStart,
}) => (
  <section className="standard-section">
    <button
      onClick={onVariantClick}
      disabled={loading !== null}
      className={`mode-card ${isOpen ? "mode-card-active" : ""}`}
    >
      <div className="mode-card-info">
        <span className="mode-card-label">{game.label}</span>
        <span className="mode-card-desc">{game.description}</span>
      </div>
      <span className="mode-card-arrow">
        {isConfigurable ? (isOpen ? "▲" : "▼") : "→"}
      </span>
    </button>

    {isConfigurable && isOpen && (
      <ConfigPanel
        size={size}
        onSizeChange={onSizeChange}
        difficulty={difficulty}
        onDifficultyChange={onDifficultyChange}
        showDifficulty={mode === "bot"}
        loading={loading === game.id}
        onStart={onStart}
        startLabel={`Start ${game.label}`}
      />
    )}
  </section>
);

export default GameSelect;
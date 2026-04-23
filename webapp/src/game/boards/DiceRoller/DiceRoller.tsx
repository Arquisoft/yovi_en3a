import { useEffect, useState } from "react";
import "./DiceRoller.css";

type DiceResult = "player" | "bot" | null;

interface DiceRollerProps {
  isRolling: boolean;
  diceResult: DiceResult;
  isMultiplayer?: boolean;
}

/**
 * 3×3 dot grid layout for each die face.
 * Positions: [tl, tc, tr, ml, mc, mr, bl, bc, br]
 */
const FACES: Record<number, boolean[]> = {
  1: [false, false, false, false, true,  false, false, false, false],
  2: [false, false, true,  false, false, false, true,  false, false],
  3: [false, false, true,  false, true,  false, true,  false, false],
  4: [true,  false, true,  false, false, false, true,  false, true ],
  5: [true,  false, true,  false, true,  false, true,  false, true ],
  6: [true,  false, true,  true,  false, true,  true,  false, true ],
};

const BG_ROLLING = "#2d3748";
const BG_PLAYER  = "#1d4ed8";
const BG_BOT     = "#991b1b";

export default function DiceRoller({ isRolling, diceResult, isMultiplayer = false }: DiceRollerProps) {
  const [face, setFace]       = useState(1);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (isRolling) {
      // Rapidly cycle through faces while rolling
      const id = setInterval(() => {
        setFace(Math.floor(Math.random() * 6) + 1);
      }, 80);
      return () => clearInterval(id);
    }

    if (diceResult) {
      // Player tends to roll high, bot tends to roll low
      const val =
        diceResult === "player"
          ? Math.floor(Math.random() * 3) + 4  // 4-6
          : Math.floor(Math.random() * 3) + 1; // 1-3
      setFace(val);
      setAnimKey((k) => k + 1); // re-mount die element → triggers pop CSS animation
    }
  }, [isRolling, diceResult]);

  const bgColor =
    isRolling               ? BG_ROLLING :
    diceResult === "player" ? BG_PLAYER  :
    diceResult === "bot"    ? BG_BOT     :
    BG_ROLLING;

  const wrapperClass =
    "dr-wrapper" +
    (!isRolling && diceResult === "player" ? " dr-player" : "") +
    (!isRolling && diceResult === "bot"    ? " dr-bot"    : "");

  const label =
    isRolling               ? "Rolling..." :
    diceResult === "player" ? "Player 1's turn!" :
    diceResult === "bot"    ? (isMultiplayer ? "Player 2's turn!" : "Bot's turn") :
    "";

  const labelColor =
    isRolling               ? "#9ca3af" :
    diceResult === "player" ? "#93c5fd" :
    "#fca5a5";

  return (
    <div className={wrapperClass}>
      {/* key forces remount so .dr-pop fires on each new result */}
      <div
        key={`die-${animKey}`}
        className={`dr-die ${isRolling ? "dr-rolling" : animKey > 0 ? "dr-pop" : ""}`}
        style={{ backgroundColor: bgColor }}
      >
        {(FACES[face] ?? FACES[1]).map((active, i) => (
          <span key={i} className={`dr-dot${active ? " dr-dot-on" : ""}`} />
        ))}
      </div>

      <div
        className="dr-label"
        style={{
          color: labelColor,
          opacity: isRolling || diceResult ? 1 : 0,
        }}
      >
        {label}
      </div>
    </div>
  );
}

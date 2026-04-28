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

const DICE_RANGES = {
  player: { min: 4, max: 6 },
  bot: { min: 1, max: 3 },
};

/**
 * Generates a cryptographically secure random integer between min (inclusive) and max (inclusive)
 */
function secureRandomInt(min: number, max: number): number {
  const range = max - min + 1;
  const bytesNeeded = Math.ceil(Math.log2(range) / 8);
  const maxValid = Math.floor(256 ** bytesNeeded / range) * range - 1;
  
  let randomValue: number;
  const randomBytes = new Uint8Array(bytesNeeded);
  
  do {
    crypto.getRandomValues(randomBytes);
    randomValue = randomBytes.reduce((acc, byte, i) => acc + byte * (256 ** i), 0);
  } while (randomValue > maxValid);
  
  return min + (randomValue % range);
}

function getBackgroundColor(isRolling: boolean, diceResult: DiceResult): string {
  if (isRolling) return BG_ROLLING;
  if (diceResult === "player") return BG_PLAYER;
  if (diceResult === "bot") return BG_BOT;
  return BG_ROLLING;
}

function getWrapperClass(isRolling: boolean, diceResult: DiceResult): string {
  const classes = ["dr-wrapper"];
  
  if (!isRolling && diceResult === "player") {
    classes.push("dr-player");
  }
  
  if (!isRolling && diceResult === "bot") {
    classes.push("dr-bot");
  }
  
  return classes.join(" ");
}

function getLabel(isRolling: boolean, diceResult: DiceResult, isMultiplayer: boolean): string {
  if (isRolling) return "Rolling...";
  if (diceResult === "player") return "Player 1's turn!";
  if (diceResult === "bot") return isMultiplayer ? "Player 2's turn!" : "Bot's turn";
  return "";
}

function getLabelColor(isRolling: boolean, diceResult: DiceResult): string {
  if (isRolling) return "#9ca3af";
  if (diceResult === "player") return "#93c5fd";
  return "#fca5a5";
}

function getDiceAnimationClass(isRolling: boolean, animKey: number): string {
  if (isRolling) return "dr-rolling";
  if (animKey > 0) return "dr-pop";
  return "";
}

function getFaceValue(diceResult: DiceResult): number {
  if (!diceResult) return 1;
  
  const range = DICE_RANGES[diceResult];
  return secureRandomInt(range.min, range.max);
}

export default function DiceRoller({ isRolling, diceResult, isMultiplayer = false }: DiceRollerProps) {
  const [face, setFace] = useState(1);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    if (isRolling) {
      const id = setInterval(() => {
        setFace(secureRandomInt(1, 6));
      }, 80);
      return () => clearInterval(id);
    }

    if (diceResult) {
      setFace(getFaceValue(diceResult));
      setAnimKey((k) => k + 1);
    }
  }, [isRolling, diceResult]);

  const bgColor = getBackgroundColor(isRolling, diceResult);
  const wrapperClass = getWrapperClass(isRolling, diceResult);
  const label = getLabel(isRolling, diceResult, isMultiplayer);
  const labelColor = getLabelColor(isRolling, diceResult);
  const diceAnimClass = getDiceAnimationClass(isRolling, animKey);
  const shouldShowLabel = isRolling || diceResult;

  return (
    <div className={wrapperClass}>
      <div
        key={`die-${animKey}`}
        className={`dr-die ${diceAnimClass}`}
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
          opacity: shouldShowLabel ? 1 : 0,
        }}
      >
        {label}
      </div>
    </div>
  );
}
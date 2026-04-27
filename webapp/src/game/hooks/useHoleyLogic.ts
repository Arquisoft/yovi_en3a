import { useState, useEffect } from "react";
import { useGameLogic } from "./useGameLogic";
import { type BoardProps } from "../boards/Types";
import { gatewayUrl } from "../../lib/config";

// Genera una funcion a partir de un número (mulberry32)
function seededRandom(seed: number) {
  let s = seed;

  return () => {
    s |= 0; s = s + 0x6D2B79F5 | 0;
    let t = Math.imul(s ^ s >>> 15, 1 | s);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function generateHoles(boardSize: number, seed: number): Set<string> {
  const rng = seededRandom(seed);
  const holes = new Set<string>();

  for (let row = 0; row < boardSize; row++) {
    const x = boardSize - 1 - row;
    for (let y = 0; y <= row; y++) {
      const z = row - y;
      // Las esquinas nunca son holes
      if (y === 0 || z === 0 || x === 0)  {
        continue;
      }
      if (rng() < 0.15) {
        holes.add(`${x}-${y}-${z}`);
      }
    }
  }

  return holes;
}

// Convierte String a int 32 bits (FNV-1a)
function hashStr(s: string): number {
  let h = 0x811c9dc5;

  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }

  return h >>> 0;
}

export const useHoleyLogic = (
  gameIdProp: BoardProps["gameIdProp"],
  boardSize: number,
  onCellPlayed: BoardProps["onCellPlayed"],
  onGameOver: BoardProps["onGameOver"],
  onTurnChange: BoardProps["onTurnChange"],
  isMultiplayer = false
) => {
  const [holeCells, setHoleCells] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!gameIdProp) {
      return;
    }

    if (gameIdProp.startsWith("local-")) {
      setHoleCells(generateHoles(boardSize, hashStr(gameIdProp)));
      return;
    }

    const token = localStorage.getItem("token");
    fetch(`${gatewayUrl}/api/game-manager/state/${gameIdProp}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.yen?.holes && data.yen.holes.length > 0) {
          const holes = new Set<string>(
            data.yen.holes.map((h: { x: number; y: number; z: number }) => `${h.x}-${h.y}-${h.z}`)
          );
          setHoleCells(holes);
        } else {
          setHoleCells(generateHoles(boardSize, hashStr(gameIdProp)));
        }
      })
      .catch(() => {
        setHoleCells(generateHoles(boardSize, hashStr(gameIdProp ?? "fallback")));
      });
  }, [gameIdProp, boardSize]);

  const logic = useGameLogic(gameIdProp, boardSize, onCellPlayed, onGameOver, {
    onBeforeMove: () => true,
    onAfterPlayerMove: () => onTurnChange?.("p2"),
    onAfterBotMove: () => onTurnChange?.("p1"),
    isMultiplayer,
  });

  const highlightCells = new Map<string, string>();
  holeCells.forEach((key) => highlightCells.set(key, "#6b7280"));

  // Combine hole cells with locked cells from processing
  const lockedCells = new Set<string>([...holeCells, ...logic.lockedCells]);

  return { ...logic, holeCells, highlightCells, lockedCells };
};
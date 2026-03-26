/*import { useState, useEffect } from "react";
import { useGameLogic } from "./useGameLogic";
import { type BoardProps } from "../boards/Types";
import { gatewayUrl } from "../../lib/config";

export const useHoleyLogic = (
  gameIdProp: BoardProps["gameIdProp"],
  boardSize: number,
  onCellPlayed: BoardProps["onCellPlayed"],
  onGameOver: BoardProps["onGameOver"]
) => {
  const [holeCells, setHoleCells] = useState<Set<string>>(new Set());

  // Cargamos los huecos desde el estado inicial del backend
  useEffect(() => {
    if (!gameIdProp) return;
    const token = localStorage.getItem("token");
    fetch(`${gatewayUrl}/api/game-manager/state/${gameIdProp}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.yen?.holes) {
          const holes = new Set<string>(
            data.yen.holes.map((h: { x: number; y: number; z: number }) => `${h.x}-${h.y}-${h.z}`)
          );
          setHoleCells(holes);
        }
      })
      .catch(() => {});
  }, [gameIdProp]);

  const logic = useGameLogic(gameIdProp, boardSize, onCellPlayed, onGameOver, {
    onBeforeMove: () => true, // el bloqueo lo gestiona HexGrid via disabledCells
  });

  const highlightCells = new Map<string, string>();
  holeCells.forEach((key) => highlightCells.set(key, "#6b7280"));

  return { ...logic, holeCells, highlightCells };
};*/
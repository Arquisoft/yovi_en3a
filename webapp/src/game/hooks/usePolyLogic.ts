/*import { useState } from "react";
import { useGameLogic } from "./useGameLogic";
import { type BoardProps } from "../boards/Types";

// Poly-Y: múltiples tableros, el jugador que controle más esquinas gana
// El backend gestiona la lógica de esquinas, el front solo muestra el score
export const usePolyLogic = (
  gameIdProp: BoardProps["gameIdProp"],
  boardSize: number,
  onCellPlayed: BoardProps["onCellPlayed"],
  onGameOver: BoardProps["onGameOver"]
) => {
  const [corners, setCorners] = useState({ p1: 0, p2: 0 });

  const logic = useGameLogic(gameIdProp, boardSize, onCellPlayed, onGameOver, {
    onAfterBotMove: () => {
      // Actualizar score de esquinas desde el estado del backend
      if (!gameIdProp) return;
      const token = localStorage.getItem("token");
      fetch(`/api/game-manager/state/${gameIdProp}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.corners) setCorners(data.corners);
        })
        .catch(() => {});
    },
  });

  return { ...logic, corners };
};*/
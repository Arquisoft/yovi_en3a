import { useState, useCallback } from "react";
import { useGameLogic } from "./useGameLogic";
import { type BoardProps, type Coordinates } from "../boards/Types";
import { gatewayUrl } from "../../lib/config";

export const usePolyLogic = (
  gameIdProp: BoardProps["gameIdProp"],
  boardSize: number,
  onCellPlayed: BoardProps["onCellPlayed"],
  onGameOver: BoardProps["onGameOver"],
  onTurnChange: BoardProps["onTurnChange"]
) => {
  const [corners, setCorners] = useState({ p1: 0, p2: 0 });

  const fetchCorners = useCallback(() => {
    if (!gameIdProp) return;
    const token = localStorage.getItem("token");
    fetch(`${gatewayUrl}/api/game-manager/state/${gameIdProp}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.corners) setCorners(data.corners);
      })
      .catch(() => {});
  }, [gameIdProp]);

  const logic = useGameLogic(gameIdProp, boardSize, onCellPlayed, onGameOver, {
    onAfterPlayerMove: (_coord: Coordinates) => {
      fetchCorners();
      onTurnChange?.("p2");
    },
    onAfterBotMove: (_coord: Coordinates) => {
      fetchCorners();
      onTurnChange?.("p1");
    },
  });

  return { ...logic, corners };
};
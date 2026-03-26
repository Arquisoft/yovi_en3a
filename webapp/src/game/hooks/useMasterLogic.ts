import { useState } from "react";
import { useGameLogic } from "./useGameLogic";
import { type BoardProps } from "../boards/Types";

export const useMasterLogic = (
  gameIdProp: BoardProps["gameIdProp"],
  boardSize: number,
  onCellPlayed: BoardProps["onCellPlayed"],
  onGameOver: BoardProps["onGameOver"]
) => {
  const [piecesThisTurn, setPiecesThisTurn] = useState(0);
  const [blocked, setBlocked] = useState(false);

  const logic = useGameLogic(gameIdProp, boardSize, onCellPlayed, onGameOver, {
    onBeforeMove: () => !blocked,
    onAfterPlayerMove: () => {
      const next = piecesThisTurn + 1;
      if (next >= 2) {
        setPiecesThisTurn(0);
        setBlocked(true);
      } else {
        setPiecesThisTurn(next);
      }
    },
    onAfterBotMove: () => {
      setPiecesThisTurn(0);
      setBlocked(false);
    },
  });

  return { ...logic, piecesThisTurn, blocked };
};
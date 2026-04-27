import { useGameLogic } from "./useGameLogic";
import { type BoardProps } from "../Boards/Types";

export const useWhyNotLogic = (
  gameIdProp: BoardProps["gameIdProp"],
  boardSize: number,
  onCellPlayed: BoardProps["onCellPlayed"],
  onGameOver: BoardProps["onGameOver"],
  onTurnChange: BoardProps["onTurnChange"],
  isMultiplayer = false
) => {
  const invertedOnGameOver = (winner: "p1" | "p2") => {
    onGameOver?.(winner === "p1" ? "p2" : "p1");
  };

  const logic = useGameLogic(gameIdProp, boardSize, onCellPlayed, invertedOnGameOver, {
    onAfterPlayerMove: () => onTurnChange?.("p2"),
    onAfterBotMove: () => onTurnChange?.("p1"),
    isMultiplayer,
  });

  // lockedCells is already included from logic via spread operator
  return { ...logic };
};
//};
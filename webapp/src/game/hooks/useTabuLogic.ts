import { useState } from "react";
import { useGameLogic } from "./useGameLogic";
import { type BoardProps, type Coordinates } from "../boards/Types";

const getAdjacentKeys = (coord: Coordinates): Set<string> => {
  const { x, y, z } = coord;
  return new Set([
    `${x+1}-${y-1}-${z}`, `${x+1}-${y}-${z-1}`,
    `${x}-${y+1}-${z-1}`, `${x}-${y-1}-${z+1}`,
    `${x-1}-${y+1}-${z}`, `${x-1}-${y}-${z+1}`,
  ]);
};

export const useTabuLogic = (
  gameIdProp: BoardProps["gameIdProp"],
  boardSize: number,
  onCellPlayed: BoardProps["onCellPlayed"],
  onGameOver: BoardProps["onGameOver"],
  onTurnChange: BoardProps["onTurnChange"]
) => {
  const [tabuCells, setTabuCells] = useState<Set<string>>(new Set());

  const logic = useGameLogic(gameIdProp, boardSize, onCellPlayed, onGameOver, {
    onBeforeMove: () => true,
    onAfterPlayerMove: () => {
      setTabuCells(new Set());
      onTurnChange?.("p2");
    },
    onAfterBotMove: (coord: Coordinates) => {
      setTabuCells(getAdjacentKeys(coord));
      onTurnChange?.("p1");
    },
  });

  const highlightCells = new Map<string, string>();
  tabuCells.forEach((key) => highlightCells.set(key, "#ef4444"));

  return { ...logic, tabuCells, highlightCells };
};
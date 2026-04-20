import { useState, useEffect, useCallback } from "react";
import { useGameLogic } from "./useGameLogic";
import { type BoardProps } from "../boards/Types";

type DiceResult = "player" | "bot";

export const useFortuneLogic = (
  gameIdProp: BoardProps["gameIdProp"],
  boardSize: number,
  onCellPlayed: BoardProps["onCellPlayed"],
  onGameOver: BoardProps["onGameOver"],
  onTurnChange: BoardProps["onTurnChange"]
) => {
  const [diceResult, setDiceResult] = useState<DiceResult | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [playerCanMove, setPlayerCanMove] = useState(false);

  const logic = useGameLogic(gameIdProp, boardSize, onCellPlayed, onGameOver, {
    onBeforeMove: () => playerCanMove,
    onAfterPlayerMove: () => setPlayerCanMove(false),
    skipBotAfterMove: true,
  });

  const rollDice = useCallback(() => {
    setIsRolling(true);
    setPlayerCanMove(false);
    setTimeout(() => {
      const result: DiceResult = Math.random() < 0.5 ? "player" : "bot";
      setDiceResult(result);
      setIsRolling(false);

      if (result === "player") {
        onTurnChange?.("p1");
        setPlayerCanMove(true);
      } else {
        onTurnChange?.("p2");
        logic.executeBotMove().then(() => {
          setTimeout(() => rollDice(), 600);
        });
      }
    }, 800);
  }, [logic.executeBotMove, onTurnChange]);

  const handleClick = useCallback(async (coordinates: any, name: string) => {
    await logic.handleClick(coordinates, name);
    setTimeout(() => rollDice(), 600);
  }, [logic.handleClick, rollDice]);

  useEffect(() => {
    rollDice();
  }, []);

  return {
    ...logic,
    handleClick,
    diceResult,
    isRolling,
    playerCanMove,
    rollDice,
  };
};
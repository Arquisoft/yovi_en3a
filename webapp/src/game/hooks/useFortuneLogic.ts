import { useState, useEffect, useCallback, useRef } from "react";
import { useGameLogic } from "./useGameLogic";
import { type BoardProps } from "../boards/Types";
import { generateAllCellKeys } from "./cellLockingUtils";

type DiceResult = "player" | "bot";

export const useFortuneLogic = (
  gameIdProp: BoardProps["gameIdProp"],
  boardSize: number,
  onCellPlayed: BoardProps["onCellPlayed"],
  onGameOver: BoardProps["onGameOver"],
  onTurnChange: BoardProps["onTurnChange"],
  isMultiplayer = false
) => {
  const [diceResult, setDiceResult] = useState<DiceResult | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [playerCanMove, setPlayerCanMove] = useState(false);
  const [isP2TurnLocal, setIsP2TurnLocal] = useState(false);
  const isP2TurnLocalRef = useRef(false);

  const logic = useGameLogic(gameIdProp, boardSize, onCellPlayed, onGameOver, {
    onBeforeMove: () => playerCanMove,
    onAfterPlayerMove: () => setPlayerCanMove(false),
    skipBotAfterMove: true,
    isMultiplayer,
  });

  const rollDice = useCallback(() => {
    setIsRolling(true);
    setPlayerCanMove(false);
    isP2TurnLocalRef.current = false;
    setIsP2TurnLocal(false);

    setTimeout(() => {
      const result: DiceResult = Math.random() < 0.5 ? "player" : "bot";
      setDiceResult(result);
      setIsRolling(false);

      if (result === "player") {
        onTurnChange?.("p1");
        setPlayerCanMove(true);
      } else {
        onTurnChange?.("p2");
        if (isMultiplayer) {
          isP2TurnLocalRef.current = true;
          setIsP2TurnLocal(true);
        } else {
          logic.executeBotMove().then(() => {
            setTimeout(() => rollDice(), 600);
          });
        }
      }
    }, 800);
  }, [logic.executeBotMove, onTurnChange, isMultiplayer]);

  const handleClick = useCallback((coordinates: any, name: string) => {
    if (isMultiplayer) {
      if (isP2TurnLocalRef.current) {
        logic.executeP2Move(coordinates, name);
        isP2TurnLocalRef.current = false;
        setIsP2TurnLocal(false);
        setTimeout(() => rollDice(), 600);
      } else if (playerCanMove) {
        logic.executeP1MoveLocal(coordinates, name);
        setPlayerCanMove(false);
        setTimeout(() => rollDice(), 600);
      }
    } else {
      if (!playerCanMove) {
        return;
      }

      logic.handleClick(coordinates, name);
      setTimeout(() => rollDice(), 600);
    }
  }, [logic, rollDice, playerCanMove, isMultiplayer]);

  useEffect(() => {
    rollDice();
  }, []);

  // Lock cells when rolling dice, during bot processing, or when player can't move
  // For multiplayer, also lock when waiting for the other player
  const shouldLockAllCells = isRolling || logic.isProcessing || 
    (!isMultiplayer && !playerCanMove) ||
    (isMultiplayer && !playerCanMove && !isP2TurnLocal);
  
  const lockedCells = shouldLockAllCells ? generateAllCellKeys(boardSize) : new Set<string>();

  return {
    ...logic,
    handleClick,
    diceResult,
    isRolling,
    playerCanMove,
    rollDice,
    isP2TurnLocal,
    lockedCells,
  };
};
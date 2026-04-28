import { useState, useEffect, useCallback, useRef } from "react";
import { useGameLogic } from "./useGameLogic";
import { type BoardProps } from "../boards/Types";
import { generateAllCellKeys } from "./cellLockingUtils";

type DiceResult = "player" | "bot";

/**
 * Generates a cryptographically secure random boolean with 50/50 probability
 */
function secureRandomBoolean(): boolean {
  const randomBytes = new Uint8Array(1);
  crypto.getRandomValues(randomBytes);
  return randomBytes[0] < 128;
}

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
  const rollDiceRef = useRef<() => void>(() => {});

  const logic = useGameLogic(gameIdProp, boardSize, onCellPlayed, onGameOver, {
    onBeforeMove: () => playerCanMove,
    skipBotAfterMove: true,
    isMultiplayer,
  });

  const rollDice = useCallback(() => {
    setIsRolling(true);
    setPlayerCanMove(false);
    isP2TurnLocalRef.current = false;
    setIsP2TurnLocal(false);

    setTimeout(() => {
      const result: DiceResult = secureRandomBoolean() ? "player" : "bot";
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

  rollDiceRef.current = rollDice;

  const handleClick = useCallback((coordinates: any, name: string) => {
    if (isMultiplayer) {
      if (isP2TurnLocalRef.current) {
        logic.executeP2Move(coordinates, name);
        isP2TurnLocalRef.current = false;
        setIsP2TurnLocal(false);
        setTimeout(() => rollDice(), 600);
      } else if (playerCanMove) {
        setPlayerCanMove(false);
        logic.executeP1MoveLocal(coordinates, name);
        setTimeout(() => rollDiceRef.current(), 600);
      }
    } else {
      if (!playerCanMove) {
        return;
      }

      setPlayerCanMove(false);
      logic.handleClick(coordinates, name);
      setTimeout(() => rollDiceRef.current(), 600);
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
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

function handlePlayerResult(
  onTurnChange: BoardProps["onTurnChange"] | undefined,
  setPlayerCanMove: (value: boolean) => void
) {
  onTurnChange?.("p1");
  setPlayerCanMove(true);
}

function handleBotResultMultiplayer(
  isP2TurnLocalRef: React.MutableRefObject<boolean>,
  setIsP2TurnLocal: (value: boolean) => void
) {
  isP2TurnLocalRef.current = true;
  setIsP2TurnLocal(true);
}

function handleBotResultSinglePlayer(
  logic: ReturnType<typeof useGameLogic>,
  rollDice: () => void
) {
  logic.executeBotMove().then(() => {
    setTimeout(() => rollDice(), 600);
  });
}

function handleBotResult(
  isMultiplayer: boolean,
  onTurnChange: BoardProps["onTurnChange"] | undefined,
  isP2TurnLocalRef: React.MutableRefObject<boolean>,
  setIsP2TurnLocal: (value: boolean) => void,
  logic: ReturnType<typeof useGameLogic>,
  rollDice: () => void
) {
  onTurnChange?.("p2");
  
  if (isMultiplayer) {
    handleBotResultMultiplayer(isP2TurnLocalRef, setIsP2TurnLocal);
  } else {
    handleBotResultSinglePlayer(logic, rollDice);
  }
}

function processDiceResult(
  result: DiceResult,
  onTurnChange: BoardProps["onTurnChange"] | undefined,
  setPlayerCanMove: (value: boolean) => void,
  isMultiplayer: boolean,
  isP2TurnLocalRef: React.MutableRefObject<boolean>,
  setIsP2TurnLocal: (value: boolean) => void,
  logic: ReturnType<typeof useGameLogic>,
  rollDice: () => void
) {
  if (result === "player") {
    handlePlayerResult(onTurnChange, setPlayerCanMove);
  } else {
    handleBotResult(
      isMultiplayer,
      onTurnChange,
      isP2TurnLocalRef,
      setIsP2TurnLocal,
      logic,
      rollDice
    );
  }
}

function handleP2Click(
  logic: ReturnType<typeof useGameLogic>,
  coordinates: any,
  name: string,
  isP2TurnLocalRef: React.MutableRefObject<boolean>,
  setIsP2TurnLocal: (value: boolean) => void,
  rollDice: () => void
) {
  logic.executeP2Move(coordinates, name);
  isP2TurnLocalRef.current = false;
  setIsP2TurnLocal(false);
  setTimeout(() => rollDice(), 600);
}

function handleP1ClickMultiplayer(
  logic: ReturnType<typeof useGameLogic>,
  coordinates: any,
  name: string,
  setPlayerCanMove: (value: boolean) => void,
  rollDiceRef: React.MutableRefObject<() => void>
) {
  setPlayerCanMove(false);
  logic.executeP1MoveLocal(coordinates, name);
  setTimeout(() => rollDiceRef.current(), 600);
}

function handleClickMultiplayer(
  isP2TurnLocalRef: React.MutableRefObject<boolean>,
  playerCanMove: boolean,
  logic: ReturnType<typeof useGameLogic>,
  coordinates: any,
  name: string,
  setIsP2TurnLocal: (value: boolean) => void,
  rollDice: () => void,
  setPlayerCanMove: (value: boolean) => void,
  rollDiceRef: React.MutableRefObject<() => void>
) {
  if (isP2TurnLocalRef.current) {
    handleP2Click(logic, coordinates, name, isP2TurnLocalRef, setIsP2TurnLocal, rollDice);
    return;
  }
  
  if (playerCanMove) {
    handleP1ClickMultiplayer(logic, coordinates, name, setPlayerCanMove, rollDiceRef);
  }
}

function handleClickSinglePlayer(
  playerCanMove: boolean,
  logic: ReturnType<typeof useGameLogic>,
  coordinates: any,
  name: string,
  setPlayerCanMove: (value: boolean) => void,
  rollDiceRef: React.MutableRefObject<() => void>
) {
  if (!playerCanMove) {
    return;
  }

  setPlayerCanMove(false);
  logic.handleClick(coordinates, name);
  setTimeout(() => rollDiceRef.current(), 600);
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

      processDiceResult(
        result,
        onTurnChange,
        setPlayerCanMove,
        isMultiplayer,
        isP2TurnLocalRef,
        setIsP2TurnLocal,
        logic,
        rollDice
      );
    }, 800);
  }, [logic, onTurnChange, isMultiplayer]);

  rollDiceRef.current = rollDice;

  const handleClick = useCallback((coordinates: any, name: string) => {
    if (isMultiplayer) {
      handleClickMultiplayer(
        isP2TurnLocalRef,
        playerCanMove,
        logic,
        coordinates,
        name,
        setIsP2TurnLocal,
        rollDice,
        setPlayerCanMove,
        rollDiceRef
      );
    } else {
      handleClickSinglePlayer(
        playerCanMove,
        logic,
        coordinates,
        name,
        setPlayerCanMove,
        rollDiceRef
      );
    }
  }, [logic, rollDice, playerCanMove, isMultiplayer]);

  useEffect(() => {
    rollDice();
  }, []);

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
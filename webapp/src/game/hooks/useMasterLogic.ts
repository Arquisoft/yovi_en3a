import { useState, useRef, useCallback } from "react";
import { useGameLogic } from "./useGameLogic";
import { type BoardProps } from "../boards/Types";
import { generateAllCellKeys } from "./cellLockingUtils";

/**
 * Generates a cryptographically secure random integer between 0 (inclusive) and max (exclusive)
 */
function secureRandomInt(max: number): number {
  const randomBytes = new Uint32Array(1);
  crypto.getRandomValues(randomBytes);
  return randomBytes[0] % max;
}

export const useMasterLogic = (
  gameIdProp: BoardProps["gameIdProp"],
  boardSize: number,
  onCellPlayed: BoardProps["onCellPlayed"],
  onGameOver: BoardProps["onGameOver"],
  onTurnChange: BoardProps["onTurnChange"],
  isMultiplayer = false
) => {
  const [piecesThisTurn, setPiecesThisTurn] = useState(0);
  const [waitingForSecond, setWaitingForSecond] = useState(false);
  const [whosTurn, setWhosTurn] = useState<"p1" | "p2">("p1");
  const [isProcessingBotMoves, setIsProcessingBotMoves] = useState(false);
  const whosTurnRef = useRef<"p1" | "p2">("p1");
  const piecesThisTurnRef = useRef(0);

  const logic = useGameLogic(gameIdProp, boardSize, onCellPlayed, onGameOver, {
    onBeforeMove: () => true,
    skipBotAfterMove: true,
    isMultiplayer,
  });

  const updateTurnState = (nextPieces: number, nextTurn: "p1" | "p2") => {
    const isTurnComplete = nextPieces >= 2;

    if (isTurnComplete) {
      piecesThisTurnRef.current = 0;
      setPiecesThisTurn(0);
      setWaitingForSecond(false);
      whosTurnRef.current = nextTurn;
      setWhosTurn(nextTurn);
      onTurnChange?.(nextTurn);
    } else {
      piecesThisTurnRef.current = nextPieces;
      setPiecesThisTurn(nextPieces);
      setWaitingForSecond(true);
      onTurnChange?.(nextTurn);
    }

    return isTurnComplete;
  };

  const handleP2Click = (coordinates: any, name: string) => {
    logic.executeP2Move(coordinates, name);
    const next = piecesThisTurnRef.current + 1;
    updateTurnState(next, next >= 2 ? "p1" : "p2");
  };

  const handleP1Click = (coordinates: any, name: string) => {
    logic.executeP1MoveLocal(coordinates, name);
    const next = piecesThisTurnRef.current + 1;
    updateTurnState(next, next >= 2 ? "p2" : "p1");
  };

  const executeBotTurn = async () => {
    setIsProcessingBotMoves(true);
    await logic.executeBotMove();
    await logic.executeBotMove();
    setIsProcessingBotMoves(false);
    onTurnChange?.("p1");
  };

  const handleSinglePlayerClick = (coordinates: any, name: string) => {
    logic.handleClick(coordinates, name);
    const next = piecesThisTurnRef.current + 1;
    const isTurnComplete = updateTurnState(next, next >= 2 ? "p2" : "p1");

    if (isTurnComplete) {
      Promise.resolve().then(executeBotTurn);
    }
  };

  const handleClick = useCallback((coordinates: any, name: string) => {
    if (!isMultiplayer) {
      handleSinglePlayerClick(coordinates, name);
      return;
    }

    if (whosTurnRef.current === "p2") {
      handleP2Click(coordinates, name);
    } else {
      handleP1Click(coordinates, name);
    }
  }, [logic, onTurnChange, isMultiplayer]);

  const randomCoord = () => {
    const all: any[] = [];
    for (let row = 0; row < boardSize; row++) {
      const x = boardSize - 1 - row;
      for (let y = 0; y <= row; y++) {
        all.push({ x, y, z: row - y });
      }
    }

    const available = all.filter(c => !logic.playedCoords.current.has(`${c.x}-${c.y}-${c.z}`));
    
    if (available.length === 0) {
      return null;
    }

    return available[secureRandomInt(available.length)];
  };

  const makeRandomMove = useCallback(() => {
    if (isMultiplayer && whosTurnRef.current !== "p1") {
      return;
    }

    const coord = randomCoord();
    if (!coord) {
      return;
    }

    handleClick(coord, `(${coord.x},${coord.y},${coord.z})`);
  }, [handleClick, isMultiplayer]);

  const makeRandomP2Move = useCallback(() => {
    if (!isMultiplayer || whosTurnRef.current !== "p2") {
      return;
    }

    const coord = randomCoord();
    if (!coord) {
      return;
    }

    handleClick(coord, `(${coord.x},${coord.y},${coord.z})`);
  }, [handleClick, isMultiplayer]);

  return {
    ...logic,
    handleClick,
    piecesThisTurn,
    waitingForSecond,
    whosTurn,
    lockedCells: isProcessingBotMoves ? generateAllCellKeys(boardSize) : logic.lockedCells,
    gameBoardRef: { ...logic.gameBoardRef, makeRandomMove, makeRandomP2Move },
  };
};
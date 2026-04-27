import { useState, useRef, useCallback } from "react";
import { useGameLogic } from "./useGameLogic";
import { type BoardProps } from "../boards/Types";
import { generateAllCellKeys } from "./cellLockingUtils";

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

  const handleClick = useCallback((coordinates: any, name: string) => {
    if (isMultiplayer) {
      if (whosTurnRef.current === "p2") {
        logic.executeP2Move(coordinates, name);
        const next = piecesThisTurnRef.current + 1;
        if (next >= 2) {
          piecesThisTurnRef.current = 0; setPiecesThisTurn(0); setWaitingForSecond(false);
          whosTurnRef.current = "p1"; setWhosTurn("p1"); onTurnChange?.("p1");
        } else {
          piecesThisTurnRef.current = next; setPiecesThisTurn(next);
          setWaitingForSecond(true); onTurnChange?.("p2");
        }
      } else {
        logic.executeP1MoveLocal(coordinates, name);
        const next = piecesThisTurnRef.current + 1;
        if (next >= 2) {
          piecesThisTurnRef.current = 0; setPiecesThisTurn(0); setWaitingForSecond(false);
          whosTurnRef.current = "p2"; setWhosTurn("p2"); onTurnChange?.("p2");
        } else {
          piecesThisTurnRef.current = next; setPiecesThisTurn(next);
          setWaitingForSecond(true); onTurnChange?.("p1");
        }
      }
    } else {
      logic.handleClick(coordinates, name);
      const next = piecesThisTurnRef.current + 1;
      if (next >= 2) {
        piecesThisTurnRef.current = 0; setPiecesThisTurn(0); setWaitingForSecond(false);
        onTurnChange?.("p2");
        setIsProcessingBotMoves(true);
        Promise.resolve().then(async () => {
          await logic.executeBotMove();
          await logic.executeBotMove();
          setIsProcessingBotMoves(false);
          onTurnChange?.("p1");
        });
      } else {
        piecesThisTurnRef.current = next; setPiecesThisTurn(next);
        setWaitingForSecond(true); onTurnChange?.("p1");
      }
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

    return available[Math.floor(Math.random() * available.length)];
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
  }, [handleClick]);

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
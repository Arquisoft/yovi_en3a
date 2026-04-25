import { useState, useRef, useCallback } from "react";
import { type BoardProps, type Coordinates } from "../boards/Types";
import { type HexCellRef } from "../HexCell";
import { checkYWin } from "./useGameLogic";
import { generateAllCellKeys } from "./cellLockingUtils";

type PiePhase = "p1_first" | "p2_choice" | "playing";

export const usePieLogic = (
  boardSize: number,
  onCellPlayed: BoardProps["onCellPlayed"],
  onGameOver: BoardProps["onGameOver"],
  onTurnChange: BoardProps["onTurnChange"]
) => {
  const cellRefs = useRef<Map<string, HexCellRef>>(new Map());
  const playedCoords = useRef<Set<string>>(new Set());
  const p1Cells = useRef<Set<string>>(new Set());
  const p2Cells = useRef<Set<string>>(new Set());
  const [phase, setPhase] = useState<PiePhase>("p1_first");
  const [currentTurnPlayer, setCurrentTurnPlayer] = useState<"p1" | "p2">("p1");
  const currentTurnRef = useRef<"p1" | "p2">("p1");
  const [swapActive, setSwapActive] = useState(false);
  const swapRef = useRef(false);
  const firstCellKeyRef = useRef<string | null>(null);

  const selectCell = useCallback((x: number, y: number, z: number, player: "p1" | "p2") => {
    const cellRef = cellRefs.current.get(`${x}-${y}-${z}`);
    if (cellRef) {
      return player === "p1" ? cellRef.selectByPlayer() : cellRef.selectByPlayer2();
    } 

    return false;
  }, []);

  const handleRequestSelectCell = useCallback((coordinates: Coordinates, player: "p1" | "p2") => {
    selectCell(coordinates.x, coordinates.y, coordinates.z, player);
  }, [selectCell]);

  const handleClick = useCallback((coordinates: Coordinates, name: string) => {
    const key = `${coordinates.x}-${coordinates.y}-${coordinates.z}`;
    if (playedCoords.current.has(key)) {
      return;
    }

    const turn = currentTurnRef.current;
    const swap = swapRef.current;

    if (phase === "p1_first") {
      selectCell(coordinates.x, coordinates.y, coordinates.z, "p1");
      playedCoords.current.add(key);
      p1Cells.current.add(key);
      firstCellKeyRef.current = key;
      onCellPlayed?.("p1", "Player 1", name);
      setPhase("p2_choice");
      onTurnChange?.("p2");
      return;
    }

    if (phase === "p2_choice") {
      return; 
    }

    if (phase === "playing") {
      const visualPlayer: "p1" | "p2" = swap ? (turn === "p1" ? "p2" : "p1") : turn;

      selectCell(coordinates.x, coordinates.y, coordinates.z, visualPlayer);
      playedCoords.current.add(key);

      if (turn === "p1") {
        p1Cells.current.add(key);
        onCellPlayed?.(visualPlayer, swap ? "Player 1 (swapped)" : "Player 1", name);
        if (checkYWin(p1Cells.current)) {
          onGameOver?.(visualPlayer); 
          return;
        }
        currentTurnRef.current = "p2";
        setCurrentTurnPlayer("p2");
        onTurnChange?.("p2");
      } else {
        p2Cells.current.add(key);
        onCellPlayed?.(visualPlayer, swap ? "Player 2 (swapped)" : "Player 2", name);
        if (checkYWin(p2Cells.current)) {
          onGameOver?.(visualPlayer);
          return;
        }
        currentTurnRef.current = "p1";
        setCurrentTurnPlayer("p1");
        onTurnChange?.("p1");
      }
    }
  }, [phase, selectCell, onCellPlayed, onGameOver, onTurnChange]);

  const handleKeep = useCallback(() => {
    swapRef.current = false;
    setSwapActive(false);
    currentTurnRef.current = "p2";
    setCurrentTurnPlayer("p2");
    setPhase("playing");
    onTurnChange?.("p2");
  }, [onTurnChange]);

  const handleSwap = useCallback(() => {
    if (firstCellKeyRef.current) {
      const [x, y, z] = firstCellKeyRef.current.split("-").map(Number);
      const cellRef = cellRefs.current.get(firstCellKeyRef.current);
      cellRef?.deselect();
      setTimeout(() => {
        selectCell(x, y, z, "p2");
      }, 0);
      p1Cells.current.delete(firstCellKeyRef.current);
      p2Cells.current.add(firstCellKeyRef.current);
    }
    swapRef.current = true;
    setSwapActive(true);
    currentTurnRef.current = "p2";
    setCurrentTurnPlayer("p2");
    setPhase("playing");
    onTurnChange?.("p2");
  }, [selectCell, onTurnChange]);

  // Lock cells when player 2 is choosing (they get to accept/reject p1's first move)
  const lockedCells = phase === "p2_choice" ? generateAllCellKeys(boardSize) : new Set<string>();

  return {
    cellRefs,
    playedCoords,
    phase,
    currentTurnPlayer,
    swapActive,
    handleClick,
    handleKeep,
    handleSwap,
    handleRequestSelectCell,
    lockedCells,
  };
};

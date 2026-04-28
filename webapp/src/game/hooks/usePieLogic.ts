import { useState, useRef, useCallback, useEffect } from "react";
import { type BoardProps, type Coordinates } from "../boards/Types";
import { useGameLogic } from "./useGameLogic";
import { generateAllCellKeys } from "./cellLockingUtils";
import { checkYWin } from "./useGameLogic";
import { flushSync } from "react-dom";

type PiePhase = "p1_first" | "p2_choice" | "playing";

export const usePieLogic = (
  gameIdProp: string | undefined,
  boardSize: number,
  onCellPlayed: BoardProps["onCellPlayed"],
  onGameOver: BoardProps["onGameOver"],
  onTurnChange: BoardProps["onTurnChange"],
  onSwap?: () => void
) => {
  const [phase, setPhase] = useState<PiePhase>("p1_first");
  const [currentTurnPlayer, setCurrentTurnPlayer] = useState<"p1" | "p2">("p1");
  const currentTurnRef = useRef<"p1" | "p2">("p1");
  const [swapActive, setSwapActive] = useState(false);
  const swapRef = useRef(false);
  const firstCellKeyRef = useRef<string | null>(null);
  const phaseRef = useRef<PiePhase>("p1_first");

  // ✅ Usar useGameLogic como base (igual que FortuneLogic)
  const logic = useGameLogic(gameIdProp, boardSize, onCellPlayed, onGameOver, {
    onBeforeMove: () => {
      return phaseRef.current === "p1_first" || phaseRef.current === "playing";
    },
    skipBotAfterMove: true,
    isMultiplayer: true, // ✅ Siempre true para Pie Rule
  });

  // Sincronizar phaseRef
  useEffect(() => {
    phaseRef.current = phase;
  }, [phase]);

  const handleClick = useCallback((coordinates: Coordinates, name: string) => {
    const key = `${coordinates.x}-${coordinates.y}-${coordinates.z}`;
    if (logic.playedCoords.current.has(key)) {
      return;
    }

    const turn = currentTurnRef.current;

    if (phase === "p1_first") {
      // Primer movimiento de P1
      flushSync(() => {
        logic.selectCell(coordinates.x, coordinates.y, coordinates.z, "p1");
      });
      logic.playedCoords.current.add(key);
      logic.p1CellsRef.current.add(key);
      firstCellKeyRef.current = key;
      onCellPlayed?.("p1", "Player 1", name);
      setPhase("p2_choice");
      onTurnChange?.("p2");
      return;
    }

    if (phase === "p2_choice") {
      return; // Bloqueado durante decisión
    }

    if (phase === "playing") {
      const visualPlayer: "p1" | "p2" = turn;

      flushSync(() => {
        logic.selectCell(coordinates.x, coordinates.y, coordinates.z, visualPlayer);
      });
      logic.playedCoords.current.add(key);

      if (turn === "p1") {
        logic.p1CellsRef.current.add(key);
        onCellPlayed?.(visualPlayer, "Player 1", name);
        if (checkYWin(logic.p1CellsRef.current)) {
          onGameOver?.(visualPlayer);
          return;
        }
        currentTurnRef.current = "p2";
        setCurrentTurnPlayer("p2");
        onTurnChange?.("p2");
      } else {
        logic.p2CellsRef.current.add(key);
        onCellPlayed?.(visualPlayer, "Player 2", name);
        if (checkYWin(logic.p2CellsRef.current)) {
          onGameOver?.(visualPlayer);
          return;
        }
        currentTurnRef.current = "p1";
        setCurrentTurnPlayer("p1");
        onTurnChange?.("p1");
      }
    }
  }, [phase, logic, onCellPlayed, onGameOver, onTurnChange]);

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
      const cellRef = logic.cellRefs.current.get(firstCellKeyRef.current);
      cellRef?.deselect();
      setTimeout(() => {
        logic.selectCell(x, y, z, "p2");
      }, 0);
      logic.p1CellsRef.current.delete(firstCellKeyRef.current);
      logic.p2CellsRef.current.add(firstCellKeyRef.current);
    }
    swapRef.current = true;
    setSwapActive(true);
    currentTurnRef.current = "p1";
    setCurrentTurnPlayer("p1");
    setPhase("playing");
    onTurnChange?.("p1");
    onSwap?.();
  }, [logic, onTurnChange, onSwap]);

  const lockedCells = phase === "p2_choice" ? generateAllCellKeys(boardSize) : new Set<string>();

  return {
    cellRefs: logic.cellRefs,
    playedCoords: logic.playedCoords,
    phase,
    currentTurnPlayer,
    swapActive,
    handleClick,
    handleKeep,
    handleSwap,
    handleRequestSelectCell: logic.handleRequestSelectCell,
    lockedCells,
  };
};
import { useState, useRef } from "react";
import { useGameLogic } from "./useGameLogic";
import { type BoardProps } from "../boards/Types";

export const useMasterLogic = (
  gameIdProp: BoardProps["gameIdProp"],
  boardSize: number,
  onCellPlayed: BoardProps["onCellPlayed"],
  onGameOver: BoardProps["onGameOver"],
  onTurnChange: BoardProps["onTurnChange"]
) => {
  const [piecesThisTurn, setPiecesThisTurn] = useState(0);
  const [waitingForSecond, setWaitingForSecond] = useState(false);
  const waitingForSecondRef = useRef(false);

  const logic = useGameLogic(gameIdProp, boardSize, onCellPlayed, onGameOver, {
    onBeforeMove: () => true,
    onAfterPlayerMove: () => {
      const next = piecesThisTurn + 1;
      if (next >= 2) {
        setPiecesThisTurn(0);
        setWaitingForSecond(false);
        waitingForSecondRef.current = false;
        // Solo cambiamos a p2 cuando el jugador ya puso las 2 piezas
        onTurnChange?.("p2");
      } else {
        setPiecesThisTurn(next);
        setWaitingForSecond(true);
        waitingForSecondRef.current = true;
        // Sigue siendo turno de p1, pero indicamos que va por la segunda pieza
        onTurnChange?.("p1");
      }
    },
    onAfterBotMove: () => {
      setPiecesThisTurn(0);
      setWaitingForSecond(false);
      waitingForSecondRef.current = false;
      onTurnChange?.("p1");
    },
    skipBotAfterMove: waitingForSecondRef.current,
  });

  return { ...logic, piecesThisTurn, waitingForSecond };
};
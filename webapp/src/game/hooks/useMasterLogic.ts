import { useState, useRef, useCallback } from "react";
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
  const piecesThisTurnRef = useRef(0);

  const logic = useGameLogic(gameIdProp, boardSize, onCellPlayed, onGameOver, {
    onBeforeMove: () => true,
    skipBotAfterMove: true, // el bot siempre lo manejamos manualmente aquí
  });

  const handleClick = useCallback(async (coordinates: any, name: string) => {
    await logic.handleClick(coordinates, name);

    const next = piecesThisTurnRef.current + 1;
    if (next >= 2) {
      // Jugador ya puso sus 2 piezas → bot pone 2
      piecesThisTurnRef.current = 0;
      setPiecesThisTurn(0);
      setWaitingForSecond(false);
      onTurnChange?.("p2");
      await logic.executeBotMove();
      await logic.executeBotMove();
      onTurnChange?.("p1");
    } else {
      // Jugador puso la 1ª pieza → esperar la 2ª
      piecesThisTurnRef.current = next;
      setPiecesThisTurn(next);
      setWaitingForSecond(true);
      onTurnChange?.("p1");
    }
  }, [logic.handleClick, logic.executeBotMove, onTurnChange]);

  return { ...logic, handleClick, piecesThisTurn, waitingForSecond };
};

/*import { useState, useEffect, useCallback, useRef } from "react";
import { useGameLogic } from "./useGameLogic";
import { type BoardProps } from "../boards/Types";
import { gatewayUrl } from "../../lib/config";

type DiceResult = "player" | "bot";

export const useFortuneLogic = (
  gameIdProp: BoardProps["gameIdProp"],
  boardSize: number,
  onCellPlayed: BoardProps["onCellPlayed"],
  onGameOver: BoardProps["onGameOver"]
) => {
  const [diceResult, setDiceResult] = useState<DiceResult | null>(null);
  const [isRolling, setIsRolling] = useState(false);
  const [playerCanMove, setPlayerCanMove] = useState(false);
  const gameIdRef = useRef(gameIdProp);
  gameIdRef.current = gameIdProp;

  const logic = useGameLogic(gameIdProp, boardSize, onCellPlayed, onGameOver, {
    onBeforeMove: () => playerCanMove,
    onAfterPlayerMove: () => setPlayerCanMove(false),
    onAfterBotMove: () => setTimeout(() => rollDice(), 600),
  });

  const triggerBotMove = useCallback(async () => {
    const gameId = gameIdRef.current;
    if (!gameId) return;
    const token = localStorage.getItem("token");

    try {
      const stateRes = await fetch(`${gatewayUrl}/api/game-manager/state/${gameId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const stateData = await stateRes.json();
      const layoutBefore: string = stateData.yen.layout;

      const res = await fetch(`${gatewayUrl}/api/game-manager/game/${gameId}/move`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ coords: { x: -1, y: -1 }, botOnly: true }),
      });

      const data = await res.json();
      if (!res.ok) return;

      if (data.status === "won" || data.status === "lost") {
        onGameOver?.(data.status === "won" ? "p1" : "p2");
        return;
      }

      const rowsBefore = layoutBefore.split("/");
      const rowsAfter: string[] = data.yen.layout.split("/");
      rowsAfter.forEach((row, rowIndex) => {
        for (let colIndex = 0; colIndex < row.length; colIndex++) {
          if (row[colIndex] === "R" && rowsBefore[rowIndex]?.[colIndex] !== "R") {
            const x = data.yen.size - 1 - rowIndex;
            const y = colIndex;
            const z = rowIndex - colIndex;
            logic.cellRefs.current.get(`${x}-${y}-${z}`)?.selectByPlayer2();
            onCellPlayed?.("p2", "Bot", `(${x},${y},${z})`);
          }
        }
      });

      setTimeout(() => rollDice(), 600);
    } catch (err) {
      console.error("Bot move error:", err);
    }
  }, []);

  const rollDice = useCallback(() => {
    setIsRolling(true);
    setPlayerCanMove(false);
    setTimeout(() => {
      const result: DiceResult = Math.random() < 0.5 ? "player" : "bot";
      setDiceResult(result);
      setIsRolling(false);
      if (result === "player") {
        setPlayerCanMove(true);
      } else {
        triggerBotMove();
      }
    }, 800);
  }, [triggerBotMove]);

  // Lanzar el dado al montar
  useEffect(() => {
    rollDice();
  }, []);

  return { ...logic, diceResult, isRolling, playerCanMove, rollDice };
};*/
/*import { useGameLogic } from "./useGameLogic";
import { type BoardProps } from "../boards/Types";

// WhyNot: el primero que conecta las tres aristas PIERDE
// La lógica de victoria invertida la gestiona el backend,
// aquí solo invertimos quién gana en el callback
export const useWhyNotLogic = (
  gameIdProp: BoardProps["gameIdProp"],
  boardSize: number,
  onCellPlayed: BoardProps["onCellPlayed"],
  onGameOver: BoardProps["onGameOver"]
) => {
  // Invertimos el ganador: si el back dice "won" es que el jugador conectó → pierde
  const invertedOnGameOver = (winner: "p1" | "p2") => {
    onGameOver?.(winner === "p1" ? "p2" : "p1");
  };

  const logic = useGameLogic(gameIdProp, boardSize, onCellPlayed, invertedOnGameOver);

  return { ...logic };
};*/
import { forwardRef } from "react";
import { useParams } from "react-router-dom";
import { BOARD_MAP } from "./boards/index";
import { type BoardProps, type GameBoardRef } from "./boards/Types";

export type { GameBoardRef, BoardProps };

const GameBoard = forwardRef<GameBoardRef, BoardProps & { gameType?: string }>(
  ({ gameType, ...props }, ref) => {
    const { gameType: urlGameType } = useParams<{ gameType: string }>();
    const resolvedType = gameType || urlGameType || "standard";
    const BoardComponent = BOARD_MAP[resolvedType] ?? BOARD_MAP.standard;

    return <BoardComponent ref={ref} {...props} />;
  }
);

GameBoard.displayName = "GameBoard";
export default GameBoard;
import { forwardRef } from "react";
import { useParams, useLocation } from "react-router-dom";
import { BOARD_MAP } from "./Boards/index";
import { type BoardProps, type GameBoardRef } from "./Boards/Types";

export type { GameBoardRef, BoardProps };

const GameBoard = forwardRef<GameBoardRef, BoardProps & { gameType?: string }>(
  ({ gameType, ...props }, ref) => {
    const { gameType: urlGameType } = useParams<{ gameType: string }>();
    const location = useLocation();

    const resolvedType = gameType || urlGameType || "standard";
    const BoardComponent = BOARD_MAP[resolvedType] ?? BOARD_MAP.standard;

    const isMultiplayer = props.isMultiplayer ?? (location.state as any)?.isMultiplayer ?? false;

    return <BoardComponent ref={ref} {...props} isMultiplayer={isMultiplayer} />;
  }
);

GameBoard.displayName = "GameBoard";
export default GameBoard;

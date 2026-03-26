import { forwardRef, useImperativeHandle } from "react";
import { type BoardProps, type GameBoardRef } from "./Types";
import { useGameLogic } from "../hooks/useGameLogic";
import HexGrid from "../HexGrid";

const StandardBoard = forwardRef<GameBoardRef, BoardProps>(
  ({ boardSize = 7, cellSize = 60, gameIdProp, onCellPlayed, onGameOver }, ref) => {
    const { cellRefs, initialOwners, handleClick, handleRequestSelectCell, gameBoardRef } =
      useGameLogic(gameIdProp, boardSize, onCellPlayed, onGameOver);

    useImperativeHandle(ref, () => gameBoardRef);

    return (
      <HexGrid
        boardSize={boardSize}
        cellSize={cellSize}
        cellRefs={cellRefs}
        initialOwners={initialOwners}
        gameId={gameIdProp}
        onCellClick={handleClick}
        onRequestSelectCell={handleRequestSelectCell}
        onCellPlayed={onCellPlayed}
        onGameOver={onGameOver}
      />
    );
  }
);

StandardBoard.displayName = "StandardBoard";
export default StandardBoard;
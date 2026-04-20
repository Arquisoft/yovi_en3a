import { forwardRef, useImperativeHandle } from "react";
import { type BoardProps, type GameBoardRef } from "./Types";
import { useHoleyLogic } from "../hooks/useHoleyLogic";
import HexGrid from "../HexGrid";

const HoleyBoard = forwardRef<GameBoardRef, BoardProps>(
  ({ boardSize = 7, cellSize = 60, gameIdProp, onCellPlayed, onGameOver, onTurnChange }, ref) => {
    const {
      cellRefs,
      initialOwners,
      handleClick,
      handleRequestSelectCell,
      gameBoardRef,
      holeCells,
      highlightCells,
    } = useHoleyLogic(gameIdProp, boardSize, onCellPlayed, onGameOver, onTurnChange);

    useImperativeHandle(ref, () => gameBoardRef);

    return (
      <HexGrid
        boardSize={boardSize}
        cellSize={cellSize}
        cellRefs={cellRefs}
        initialOwners={initialOwners}
        gameId={gameIdProp}
        disabledCells={holeCells}
        highlightCells={highlightCells}
        onCellClick={handleClick}
        onRequestSelectCell={handleRequestSelectCell}
        onCellPlayed={onCellPlayed}
        onGameOver={onGameOver}
      />
    );
  }
);

HoleyBoard.displayName = "HoleyBoard";
export default HoleyBoard;
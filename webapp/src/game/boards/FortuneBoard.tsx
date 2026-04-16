import { forwardRef, useImperativeHandle } from "react";
import { type BoardProps, type GameBoardRef } from "./Types";
import { useFortuneLogic } from "../hooks/useFortuneLogic";
import HexGrid from "../HexGrid";
import DiceRoller from "./DiceRoller";

const FortuneBoard = forwardRef<GameBoardRef, BoardProps>(
  ({ boardSize = 7, cellSize = 60, gameIdProp, onCellPlayed, onGameOver, onTurnChange }, ref) => {
    const {
      cellRefs,
      initialOwners,
      handleClick,
      handleRequestSelectCell,
      gameBoardRef,
      diceResult,
      isRolling,
      playerCanMove,
    } = useFortuneLogic(gameIdProp, boardSize, onCellPlayed, onGameOver, onTurnChange);

    useImperativeHandle(ref, () => gameBoardRef);

    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <DiceRoller isRolling={isRolling} diceResult={diceResult} />
        <HexGrid
          boardSize={boardSize}
          cellSize={cellSize}
          cellRefs={cellRefs}
          initialOwners={initialOwners}
          gameId={gameIdProp}
          disabledCells={!playerCanMove ? new Set(["__all__"]) : new Set()}
          onCellClick={handleClick}
          onRequestSelectCell={handleRequestSelectCell}
          onCellPlayed={onCellPlayed}
          onGameOver={onGameOver}
        />
      </div>
    );
  }
);

FortuneBoard.displayName = "FortuneBoard";
export default FortuneBoard;
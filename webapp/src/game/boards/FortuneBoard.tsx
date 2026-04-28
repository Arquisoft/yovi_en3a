import { forwardRef, useImperativeHandle } from "react";
import { type BoardProps, type GameBoardRef } from "./Types";
import { useFortuneLogic } from "../hooks/useFortuneLogic";
import HexGrid from "../HexGrid";
import DiceRoller from "./DiceRoller/DiceRoller";

const FortuneBoard = forwardRef<GameBoardRef, BoardProps>(
  ({ boardSize = 7, cellSize = 60, gameIdProp, onCellPlayed, onGameOver, onTurnChange, isMultiplayer = false }, ref) => {
    const {
      cellRefs,
      initialOwners,
      handleClick,
      handleRequestSelectCell,
      gameBoardRef,
      diceResult,
      isRolling,
      lockedCells,
    } = useFortuneLogic(gameIdProp, boardSize, onCellPlayed, onGameOver, onTurnChange, isMultiplayer);

    useImperativeHandle(ref, () => gameBoardRef);

    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <DiceRoller isRolling={isRolling} diceResult={diceResult} isMultiplayer={isMultiplayer} />
        <HexGrid
          boardSize={boardSize}
          cellSize={cellSize}
          cellRefs={cellRefs}
          initialOwners={initialOwners}
          gameId={gameIdProp}
          disabledCells={lockedCells}
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
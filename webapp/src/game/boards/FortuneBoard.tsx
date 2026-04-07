/*import { forwardRef, useImperativeHandle } from "react";
import { type BoardProps, type GameBoardRef } from "./Types";
import { useFortuneLogic } from "../hooks/useFortuneLogic";
import HexGrid from "../HexGrid";

const FortuneBoard = forwardRef<GameBoardRef, BoardProps>(
  ({ boardSize = 7, cellSize = 60, gameIdProp, onCellPlayed, onGameOver }, ref) => {
    const {
      cellRefs,
      initialOwners,
      handleClick,
      handleRequestSelectCell,
      gameBoardRef,
      diceResult,
      isRolling,
      playerCanMove,
    } = useFortuneLogic(gameIdProp, boardSize, onCellPlayed, onGameOver);

    useImperativeHandle(ref, () => gameBoardRef);

    return (
      <div style={{ position: "relative" }}>
        <div style={{
          position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
          color: "white", background: "rgba(0,0,0,0.5)", padding: "4px 14px",
          borderRadius: 8, fontSize: 16, zIndex: 10,
          transition: "all 0.3s",
          animation: isRolling ? "pulse 0.4s infinite alternate" : "none",
        }}>
          {isRolling ? "🎲 Rolling..." : diceResult === "player" ? "✅ Your turn!" : "🤖 Bot's turn!"}
        </div>
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
export default FortuneBoard;*/

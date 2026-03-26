import { forwardRef, useImperativeHandle } from "react";
import { type BoardProps, type GameBoardRef } from "./Types";
import { useMasterLogic } from "../hooks/useMasterLogic";
import HexGrid from "../HexGrid";

const MasterBoard = forwardRef<GameBoardRef, BoardProps>(
  ({ boardSize = 7, cellSize = 60, gameIdProp, onCellPlayed, onGameOver }, ref) => {
    const {
      cellRefs,
      initialOwners,
      handleClick,
      handleRequestSelectCell,
      gameBoardRef,
      piecesThisTurn,
      blocked,
    } = useMasterLogic(gameIdProp, boardSize, onCellPlayed, onGameOver);

    useImperativeHandle(ref, () => gameBoardRef);

    return (
      <div style={{ position: "relative" }}>
        <div style={{
          position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
          color: "white", background: "rgba(0,0,0,0.5)", padding: "4px 14px",
          borderRadius: 8, fontSize: 14, zIndex: 10,
        }}>
          {blocked ? "🤖 Bot is thinking..." : `Place piece ${piecesThisTurn + 1} of 2`}
        </div>
        <HexGrid
          boardSize={boardSize}
          cellSize={cellSize}
          cellRefs={cellRefs}
          initialOwners={initialOwners}
          gameId={gameIdProp}
          disabledCells={blocked ? new Set(["__all__"]) : new Set()}
          onCellClick={handleClick}
          onRequestSelectCell={handleRequestSelectCell}
          onCellPlayed={onCellPlayed}
          onGameOver={onGameOver}
        />
      </div>
    );
  }
);

MasterBoard.displayName = "MasterBoard";
export default MasterBoard;
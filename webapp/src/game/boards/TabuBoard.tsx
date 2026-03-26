/*import { forwardRef, useImperativeHandle } from "react";
import { type BoardProps, type GameBoardRef } from "./Types";
import { useTabuLogic } from "../hooks/useTabuLogic";
import HexGrid from "../HexGrid";

const TabuBoard = forwardRef<GameBoardRef, BoardProps>(
  ({ boardSize = 7, cellSize = 60, gameIdProp, onCellPlayed, onGameOver }, ref) => {
    const {
      cellRefs,
      initialOwners,
      handleClick,
      handleRequestSelectCell,
      gameBoardRef,
      tabuCells,
      highlightCells,
    } = useTabuLogic(gameIdProp, boardSize, onCellPlayed, onGameOver);

    useImperativeHandle(ref, () => gameBoardRef);

    return (
      <div style={{ position: "relative" }}>
        {tabuCells.size > 0 && (
          <div style={{
            position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
            color: "#ef4444", background: "rgba(0,0,0,0.5)", padding: "4px 14px",
            borderRadius: 8, fontSize: 14, zIndex: 10,
          }}>
            🚫 Tabu cells highlighted in red
          </div>
        )}
        <HexGrid
          boardSize={boardSize}
          cellSize={cellSize}
          cellRefs={cellRefs}
          initialOwners={initialOwners}
          gameId={gameIdProp}
          disabledCells={tabuCells}
          highlightCells={highlightCells}
          onCellClick={handleClick}
          onRequestSelectCell={handleRequestSelectCell}
          onCellPlayed={onCellPlayed}
          onGameOver={onGameOver}
        />
      </div>
    );
  }
);

TabuBoard.displayName = "TabuBoard";
export default TabuBoard;*/
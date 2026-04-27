import { forwardRef, useImperativeHandle } from "react";
import { type BoardProps, type GameBoardRef } from "./Types";
import { useTabuLogic } from "../hooks/useTabuLogic";
import HexGrid from "../HexGrid";

const TabuBoard = forwardRef<GameBoardRef, BoardProps>(
  ({ boardSize = 7, cellSize = 60, gameIdProp, onCellPlayed, onGameOver, onTurnChange, isMultiplayer = false }, ref) => {
    const {
      cellRefs,
      initialOwners,
      handleClick,
      handleRequestSelectCell,
      gameBoardRef,
      tabuCells,
      highlightCells,
      isP2Turn,
      lockedCells,
    } = useTabuLogic(gameIdProp, boardSize, onCellPlayed, onGameOver, onTurnChange, isMultiplayer);

    useImperativeHandle(ref, () => gameBoardRef);

    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        {/* Tabu warning banner */}
        {tabuCells.size > 0 && (
          <div style={{
            padding: "6px 16px",
            background: "rgba(0,0,0,0.55)",
            borderRadius: 8,
            fontFamily: "monospace",
            fontSize: 13,
            color: "#ef4444",
          }}>
            🚫 Tabu cells highlighted in red
          </div>
        )}

        {/* Multiplayer turn indicator */}
        {isMultiplayer && (
          <div style={{
            padding: "4px 14px",
            background: "rgba(0,0,0,0.4)",
            borderRadius: 8,
            fontFamily: "monospace",
            fontSize: 13,
            color: isP2Turn ? "#ef4444" : "#93c5fd",
          }}>
          </div>
        )}

        <HexGrid
          boardSize={boardSize}
          cellSize={cellSize}
          cellRefs={cellRefs}
          initialOwners={initialOwners}
          gameId={gameIdProp}
          disabledCells={lockedCells}
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
export default TabuBoard;
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
    } = useTabuLogic(gameIdProp, boardSize, onCellPlayed, onGameOver, onTurnChange, isMultiplayer);

    useImperativeHandle(ref, () => gameBoardRef);

    const turnLabel = isMultiplayer
      ? (isP2Turn ? "🟥 Player 2's turn" : "🟦 Player 1's turn") : null;

    return (
      <div style={{ position: "relative" }}>
        {tabuCells.size > 0 && (
          <div style={{
            position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
            color: "#ef4444", background: "rgba(0,0,0,0.5)", padding: "4px 14px",
            borderRadius: 8, fontSize: 14, zIndex: 10, whiteSpace: "nowrap",
          }}>
            🚫 Tabu cells highlighted in red
          </div>
        )}
        {isMultiplayer && (
          <div style={{
            textAlign: "center", marginBottom: 8,
            color: isP2Turn ? "#ef4444" : "#93c5fd",
            fontFamily: "monospace", fontSize: 13,
            background: "rgba(0,0,0,0.4)", padding: "4px 14px",
            borderRadius: 8, display: "inline-block",
            position: "absolute", top: tabuCells.size > 0 ? 48 : 12,
            left: "50%", transform: "translateX(-50%)", zIndex: 10,
          }}>
            {turnLabel}
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
export default TabuBoard;
import { forwardRef, useImperativeHandle } from "react";
import { type BoardProps, type GameBoardRef } from "./Types";
import { useWhyNotLogic } from "../hooks/useWhyNotLogic";
import HexGrid from "../HexGrid";

const WhyNotBoard = forwardRef<GameBoardRef, BoardProps>(
  ({ boardSize = 7, cellSize = 60, gameIdProp, showNames = true, onCellPlayed, onGameOver, onTurnChange, isMultiplayer = false }, ref) => {
    const {
      cellRefs,
      initialOwners,
      handleClick,
      handleRequestSelectCell,
      gameBoardRef,
      isP2Turn,
      lockedCells,
    } = useWhyNotLogic(gameIdProp, boardSize, onCellPlayed, onGameOver, onTurnChange, isMultiplayer);

    useImperativeHandle(ref, () => gameBoardRef);

    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        {/* Warning banner */}
        <div style={{
          padding: "6px 16px",
          background: "rgba(0,0,0,0.55)",
          borderRadius: 8,
          fontFamily: "monospace",
          fontSize: 13,
          color: "#facc15",
        }}>
          ⚠️ First to connect three edges loses
        </div>

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
          showNames={showNames}
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

WhyNotBoard.displayName = "WhyNotBoard";
export default WhyNotBoard;
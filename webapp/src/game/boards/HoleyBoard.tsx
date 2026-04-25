import { forwardRef, useImperativeHandle } from "react";
import { type BoardProps, type GameBoardRef } from "./Types";
import { useHoleyLogic } from "../hooks/useHoleyLogic";
import HexGrid from "../HexGrid";

const HoleyBoard = forwardRef<GameBoardRef, BoardProps>(
  ({ boardSize = 7, cellSize = 60, gameIdProp, onCellPlayed, onGameOver, onTurnChange, isMultiplayer = false }, ref) => {
    const {
      cellRefs,
      initialOwners,
      handleClick,
      handleRequestSelectCell,
      gameBoardRef,
      holeCells,
      highlightCells,
      isP2Turn,
      lockedCells,
    } = useHoleyLogic(gameIdProp, boardSize, onCellPlayed, onGameOver, onTurnChange, isMultiplayer);

    useImperativeHandle(ref, () => gameBoardRef);

    return (
      <div style={{ position: "relative" }}>
        {isMultiplayer && (
          <div style={{
            textAlign: "center",
            color: isP2Turn ? "#ef4444" : "#93c5fd",
            fontFamily: "monospace", fontSize: 13,
            background: "rgba(0,0,0,0.4)", padding: "4px 14px",
            borderRadius: 8, display: "inline-block",
            position: "absolute", top: 12,
            left: "50%", transform: "translateX(-50%)", zIndex: 10,
          }}>
            {isP2Turn ? "🟥 Player 2's turn" : "🟦 Player 1's turn"}
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

HoleyBoard.displayName = "HoleyBoard";
export default HoleyBoard;
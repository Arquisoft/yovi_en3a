import { forwardRef, useImperativeHandle } from "react";
import { type BoardProps, type GameBoardRef } from "./Types";
import { usePolyLogic } from "../hooks/usePolyLogic";
import HexGrid from "../HexGrid";

const PolyBoard = forwardRef<GameBoardRef, BoardProps>(
  ({ boardSize = 7, cellSize = 60, gameIdProp, onCellPlayed, onGameOver, onTurnChange }, ref) => {
    const {
      cellRefs,
      initialOwners,
      handleClick,
      handleRequestSelectCell,
      gameBoardRef,
      corners,
    } = usePolyLogic(gameIdProp, boardSize, onCellPlayed, onGameOver, onTurnChange);

    useImperativeHandle(ref, () => gameBoardRef);

    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        {/* Score de esquinas */}
        <div style={{
          display: "flex", gap: 24, padding: "6px 20px",
          background: "rgba(0,0,0,0.5)", borderRadius: 10,
          fontSize: 13, color: "white", fontFamily: "monospace",
        }}>
          <span style={{ color: "#60a5fa" }}>
            🔵 P1 corners: <strong>{corners.p1}</strong>
          </span>
          <span style={{ color: "#f87171" }}>
            🔴 P2 corners: <strong>{corners.p2}</strong>
          </span>
        </div>
        <HexGrid
          boardSize={boardSize}
          cellSize={cellSize}
          cellRefs={cellRefs}
          initialOwners={initialOwners}
          gameId={gameIdProp}
          onCellClick={handleClick}
          onRequestSelectCell={handleRequestSelectCell}
          onCellPlayed={onCellPlayed}
          onGameOver={onGameOver}
        />
      </div>
    );
  }
);

PolyBoard.displayName = "PolyBoard";
export default PolyBoard;
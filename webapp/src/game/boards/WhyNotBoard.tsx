import { forwardRef, useImperativeHandle } from "react";
import { type BoardProps, type GameBoardRef } from "./Types";
import { useWhyNotLogic } from "../Hooks/useWhyNotLogic";
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
      <div style={{ position: "relative" }}>
        <div style={{
          position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
          color: "#facc15", background: "rgba(0,0,0,0.5)", padding: "4px 14px",
          borderRadius: 8, fontSize: 13, zIndex: 10, whiteSpace: "nowrap",
        }}>
          ⚠️ First to connect three edges loses
        </div>
        {isMultiplayer && (
          <div style={{
            position: "absolute", top: 44, left: "50%", transform: "translateX(-50%)",
            color: isP2Turn ? "#ef4444" : "#93c5fd",
            background: "rgba(0,0,0,0.4)", padding: "4px 14px",
            borderRadius: 8, fontSize: 13, zIndex: 10, whiteSpace: "nowrap",
            fontFamily: "monospace",
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
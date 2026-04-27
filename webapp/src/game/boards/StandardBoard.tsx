import { forwardRef, useImperativeHandle } from "react";
import { type BoardProps, type GameBoardRef } from "./Types";
import { useGameLogic } from "../Hooks/useGameLogic";
import HexGrid from "../HexGrid";

const StandardBoard = forwardRef<GameBoardRef, BoardProps>(
  ({ boardSize = 7, cellSize = 60, gameIdProp, showNames = true, isMultiplayer = false, onCellPlayed, onGameOver, onTurnChange }, ref) => {
    const { cellRefs, initialOwners, handleClick, handleRequestSelectCell, gameBoardRef, isP2Turn, lockedCells } =
      useGameLogic(gameIdProp, boardSize, onCellPlayed, onGameOver, {
        isMultiplayer,
        onAfterPlayerMove: () => onTurnChange?.("p2"),
        onAfterBotMove: () => onTurnChange?.("p1"),
      });

    useImperativeHandle(ref, () => gameBoardRef);

    return (
      <div style={{ position: "relative" }}>
        {isMultiplayer && (
          <div style={{
            position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)",
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

StandardBoard.displayName = "StandardBoard";
export default StandardBoard;
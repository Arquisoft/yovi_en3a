import { forwardRef, useImperativeHandle } from "react";
import { type BoardProps, type GameBoardRef } from "./Types";
import { useMasterLogic } from "../hooks/useMasterLogic";
import HexGrid from "../HexGrid";

const MasterBoard = forwardRef<GameBoardRef, BoardProps>(
  ({ boardSize = 7, cellSize = 60, gameIdProp, onCellPlayed, onGameOver, onTurnChange }, ref) => {
    const {
      cellRefs,
      initialOwners,
      handleClick,
      handleRequestSelectCell,
      gameBoardRef,
      piecesThisTurn,
      waitingForSecond,
    } = useMasterLogic(gameIdProp, boardSize, onCellPlayed, onGameOver, onTurnChange);

    useImperativeHandle(ref, () => gameBoardRef);

    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div style={{
          padding: "4px 14px",
          background: "rgba(0,0,0,0.5)",
          borderRadius: 8,
          fontSize: 13,
          color: "white",
          fontFamily: "monospace",
          whiteSpace: "nowrap",
        }}>
          {waitingForSecond
            ? `🟦 Place piece 2 of 2`
            : `🟦 Place piece 1 of 2`}
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

MasterBoard.displayName = "MasterBoard";
export default MasterBoard;
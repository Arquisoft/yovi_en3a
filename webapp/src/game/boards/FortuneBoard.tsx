import { forwardRef, useImperativeHandle } from "react";
import { type BoardProps, type GameBoardRef } from "./Types";
import { useFortuneLogic } from "../hooks/useFortuneLogic";
import HexGrid from "../HexGrid";
import DiceRoller from "./DiceRoller";

const FortuneBoard = forwardRef<GameBoardRef, BoardProps>(
  ({ boardSize = 7, cellSize = 60, gameIdProp, onCellPlayed, onGameOver, onTurnChange, isMultiplayer = false }, ref) => {
    const {
      cellRefs,
      initialOwners,
      handleClick,
      handleRequestSelectCell,
      gameBoardRef,
      diceResult,
      isRolling,
      playerCanMove,
      isP2TurnLocal,
      lockedCells,
    } = useFortuneLogic(gameIdProp, boardSize, onCellPlayed, onGameOver, onTurnChange, isMultiplayer);

    useImperativeHandle(ref, () => gameBoardRef);

    const status = isRolling ? "rolling"
      : isMultiplayer ? (isP2TurnLocal ? "p2" : playerCanMove ? "p1" : "waiting")
      : diceResult === "player" ? "p1" : "bot";

    const statusText = {
      rolling: "🎲 Rolling...",
      p1: isMultiplayer ? "🟦 Player 1's turn to play" : "🟦 Your turn!",
      p2: "🟥 Player 2's turn to play",
      waiting: "🎲 Waiting...",
      bot: "🤖 Bot is playing...",
    }[status];

    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        <DiceRoller isRolling={isRolling} diceResult={diceResult} isMultiplayer={isMultiplayer} />
        <div style={{
          padding: "4px 14px",
          background: "rgba(0,0,0,0.5)",
          borderRadius: 8,
          fontSize: 13,
          color: isP2TurnLocal ? "#ef4444" : "#93c5fd",
          fontFamily: "monospace",
          whiteSpace: "nowrap",
        }}>
          {statusText}
        </div>
        <HexGrid
          boardSize={boardSize}
          cellSize={cellSize}
          cellRefs={cellRefs}
          initialOwners={initialOwners}
          gameId={gameIdProp}
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

FortuneBoard.displayName = "FortuneBoard";
export default FortuneBoard;
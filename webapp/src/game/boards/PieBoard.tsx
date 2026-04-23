import { forwardRef, useImperativeHandle } from "react";
import { type BoardProps, type GameBoardRef } from "./Types";
import { usePieLogic } from "../hooks/usePieLogic";
import HexGrid from "../HexGrid";

const PieBoard = forwardRef<GameBoardRef, BoardProps>(
  ({ boardSize = 7, cellSize = 60, gameIdProp, showNames = false, onCellPlayed, onGameOver, onTurnChange }, ref) => {
    const {
      cellRefs,
      playedCoords,
      phase,
      currentTurnPlayer,
      swapActive,
      handleClick,
      handleKeep,
      handleSwap,
      handleRequestSelectCell,
    } = usePieLogic(boardSize, onCellPlayed, onGameOver, onTurnChange);

    useImperativeHandle(ref, () => ({
      selectCellByCoordinates: (x, y, z, player) => {
        const cellRef = cellRefs.current.get(`${x}-${y}-${z}`);

        if (!cellRef) {
          return false;
        }

        return player === "p1" ? cellRef.selectByPlayer() : cellRef.selectByPlayer2();
      },
      makeRandomP2Move: () => {
        if (phase !== "playing") {
          return;
        }

        const all: import("./Types").Coordinates[] = [];
        for (let row = 0; row < boardSize; row++) {
          const x = boardSize - 1 - row;
          for (let y = 0; y <= row; y++) all.push({ x, y, z: row - y });
        }
        
        const available = all.filter(c => !playedCoords.current.has(`${c.x}-${c.y}-${c.z}`));
        if (available.length === 0) {
          return;
        }

        const coord = available[Math.floor(Math.random() * available.length)];
        handleClick(coord, `(${coord.x},${coord.y},${coord.z})`);
      },
    }));

    const bannerColor = currentTurnPlayer === "p1" ? "#93c5fd" : "#ef4444";
    const bannerEmoji = currentTurnPlayer === "p1" ? "🟦" : "🟥";
    const playerLabel = currentTurnPlayer === "p1" ? "Player 1" : "Player 2";

    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>

        {/* Status banner */}
        {phase === "p1_first" && (
          <div style={{
            padding: "6px 16px", background: "rgba(0,0,0,0.55)", borderRadius: 8,
            fontFamily: "monospace", fontSize: 13, color: "#93c5fd",
          }}>
            🟦 Player 1: place your first piece anywhere
          </div>
        )}

        {phase === "playing" && (
          <div style={{
            padding: "6px 16px", background: "rgba(0,0,0,0.55)", borderRadius: 8,
            fontFamily: "monospace", fontSize: 13, color: bannerColor,
          }}>
            {bannerEmoji} {playerLabel}'s turn
            {swapActive && (
              <span style={{ color: "#facc15", marginLeft: 8, fontSize: 11 }}>⇄ swapped</span>
            )}
          </div>
        )}

        {/* Swap decision overlay */}
        {phase === "p2_choice" && (
          <div style={{
            padding: "16px 24px",
            background: "rgba(13,17,23,0.95)",
            border: "1px solid rgba(255,255,255,0.12)",
            borderRadius: 12,
            fontFamily: "monospace",
            color: "white",
            textAlign: "center",
            zIndex: 20,
            minWidth: 280,
          }}>
            <div style={{ fontSize: 14, color: "#ef4444", fontWeight: "bold", marginBottom: 6 }}>
              🟥 Player 2's decision
            </div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", marginBottom: 14 }}>
              Do you want to swap and play first (taking the placed piece)?
            </div>
            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <button
                onClick={handleSwap}
                style={{
                  padding: "8px 22px", borderRadius: 7, border: "1px solid #ef4444",
                  background: "rgba(239,68,68,0.15)", color: "#ef4444",
                  fontFamily: "monospace", fontSize: 13, cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.3)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(239,68,68,0.15)")}
              >
                ⇄ Swap
              </button>
              <button
                onClick={handleKeep}
                style={{
                  padding: "8px 22px", borderRadius: 7, border: "1px solid #6366f1",
                  background: "rgba(99,102,241,0.15)", color: "#a5b4fc",
                  fontFamily: "monospace", fontSize: 13, cursor: "pointer",
                  transition: "all 0.15s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(99,102,241,0.3)")}
                onMouseLeave={e => (e.currentTarget.style.background = "rgba(99,102,241,0.15)")}
              >
                ✓ Keep
              </button>
            </div>
          </div>
        )}

        <HexGrid
          boardSize={boardSize}
          cellSize={cellSize}
          cellRefs={cellRefs}
          initialOwners={new Map()}
          gameId={gameIdProp}
          showNames={showNames}
          disabledCells={phase === "p2_choice" ? new Set(["__all__"]) : new Set()}
          onCellClick={handleClick}
          onRequestSelectCell={handleRequestSelectCell}
          onCellPlayed={onCellPlayed}
          onGameOver={onGameOver}
        />
      </div>
    );
  }
);

PieBoard.displayName = "PieBoard";
export default PieBoard;
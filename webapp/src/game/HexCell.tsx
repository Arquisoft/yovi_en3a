import React, { useState, useEffect, forwardRef, useImperativeHandle } from "react";

interface Coordinates {
  x: number;
  y: number;
  z: number;
}

interface HexCellProps {
  gameId?: string;
  size?: number;
  name?: string;
  owner?: "none" | "p1" | "p2";
  initialSelected?: boolean;
  disabled?: boolean;
  coordinates?: Coordinates;
  onRequestSelectCell?: (coordinates: Coordinates, player: "p1" | "p2") => void;
  onCellPlayed?: (player: "p1" | "p2", playerName: string, coordinate: string) => void;
  onGameOver?: (winner: "p1" | "p2") => void;
}

export interface HexCellRef {
  selectByPlayer: () => boolean;
  selectByPlayer2: () => boolean;
  deselect: () => boolean;
  requestSelectForPlayer2: (targetCoordinates: Coordinates) => void;
}

const playCellSound = () => {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "triangle";
    osc.frequency.value = 1000;
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);
    osc.start();
    osc.stop(ctx.currentTime + 0.03);
  } catch {
    // AudioContext not available in test environment
  }
};

const colors = {
  none: {
    bg: "#21262d",
    hover: "#30363d",
    sel: "#388bfd",
    fg: "rgba(255,255,255,0.4)",
  },
  p1: {
    bg: "#1d4ed8",
    sel: "#3b82f6",
    fg: "#eff6ff",
  },
  p2: {
    bg: "#991b1b",
    sel: "#ef4444",
    fg: "#fff1f2",
  },
};

const HexCell = forwardRef<HexCellRef, HexCellProps>(
  (
    {
      name = "cell",
      size = 60,
      owner = "none",
      initialSelected = false,
      disabled = false,
      coordinates,
      gameId,
      onRequestSelectCell,
      onCellPlayed,
      onGameOver,
    }: HexCellProps,
    ref
  ) => {
    const [selected, setSelected] = useState(initialSelected);
    const [cellOwner, setCellOwner] = useState<"none" | "p1" | "p2">(owner);

    // Actualiza el color cuando cambia de dueño, si no al recargar las casillas no se colorean
    useEffect(() => {
      if (owner !== "none") {
        setCellOwner(owner);
        setSelected(true);
      }
    }, [owner]);

    const chosen = colors[cellOwner];

    function selectByPlayer() {
      setSelected(true);
      setCellOwner("p1");
      playCellSound();
      return true;
    }

    function selectByPlayer2() {
      setSelected(true);
      setCellOwner("p2");
      playCellSound();
      return true;
    }

    function deselect() {
      setSelected(false);
      setCellOwner("none");
      return true;
    }

    function requestSelectForPlayer2(targetCoordinates: Coordinates) {
      if (onRequestSelectCell) {
        onRequestSelectCell(targetCoordinates, "p2");
      }
    }

    useImperativeHandle(ref, () => ({
      selectByPlayer,
      selectByPlayer2,
      deselect,
      requestSelectForPlayer2,
    }));

    const handleClick = async () => {
      if (selected || cellOwner !== "none" || !gameId || !coordinates) return;

      selectByPlayer();
      onCellPlayed?.("p1", "Player 1", name);

      try {
        const gatewayUrl =
          typeof import.meta !== "undefined" && import.meta.env?.VITE_API_URL
            ? import.meta.env.VITE_API_URL
            : "http://localhost:8000";

        const token =
          typeof localStorage !== "undefined"
            ? localStorage.getItem("token")
            : null;

        // Fetch state before move to compare layouts
        const stateRes = await fetch(
          `${gatewayUrl}/api/game-manager/state/${gameId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (!stateRes.ok) {
          deselect();
          return;
        }

        const stateData = await stateRes.json();
        const layoutBefore: string = stateData.yen.layout;

        // Send player move
        const res = await fetch(
          `${gatewayUrl}/api/game-manager/game/${gameId}/move`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              coords: { x: coordinates.x, y: coordinates.y },
            }),
          }
        );

        const data = await res.json();
        if (!res.ok) {
          deselect();
          throw new Error(data.error);
        } 

        if (data.status === "won" || data.status === "lost") {
          onGameOver?.(data.status === "won" ? "p1" : "p2");
          return;
        }

        const layoutAfter: string = data.yen.layout;
        const rowsBefore = layoutBefore.split("/");
        const rowsAfter = layoutAfter.split("/");

        // Compare layouts to find bot's new cell (symbol 'R')
        rowsAfter.forEach((row, rowIndex) => {
          for (let colIndex = 0; colIndex < row.length; colIndex++) {
            if (
              row[colIndex] === "R" &&
              rowsBefore[rowIndex]?.[colIndex] !== "R"
            ) {
              const x = data.yen.size - 1 - rowIndex;
              const y = colIndex;
              const z = rowIndex - colIndex;
              requestSelectForPlayer2({ x, y, z });
              onCellPlayed?.("p2", "Bot", `(${x},${y},${z})`);
            }
          }
        });
      } catch (err) {
        console.error("Move error:", err);
      }
    };

    return (
      <div
        onClick={handleClick}
        className={`hex transition-all select-none cursor-pointer${disabled ? " cursor-not-allowed opacity-50" : ""}`}
        style={{
          width: size,
          height: size,
          backgroundColor: selected ? chosen.sel : chosen.bg,
          color: chosen.fg,
          transform: selected ? "scale(1.08)" : "scale(1.0)",
        }}
      >
        {name}
      </div>
    );
  }
);

HexCell.displayName = "HexCell";

export default HexCell;
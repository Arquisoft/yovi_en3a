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
  onCellClick?: (coordinates: Coordinates, name: string) => void;
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
  } catch {}
};

const colors = {
  none: { bg: "#21262d", hover: "#30363d", sel: "#388bfd", fg: "rgba(255,255,255,0.4)" },
  p1:   { bg: "#1d4ed8", sel: "#3b82f6", fg: "#eff6ff" },
  p2:   { bg: "#991b1b", sel: "#ef4444", fg: "#fff1f2" },
};

const HexCell = forwardRef<HexCellRef, HexCellProps>(
  ({ name = "cell", size = 60, owner = "none", initialSelected = false,
     disabled = false, coordinates, onRequestSelectCell, onCellClick }, ref) => {

    const [selected, setSelected] = useState(initialSelected);
    const [cellOwner, setCellOwner] = useState<"none" | "p1" | "p2">(owner);

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
      onRequestSelectCell?.(targetCoordinates, "p2");
    }

    useImperativeHandle(ref, () => ({
      selectByPlayer, selectByPlayer2, deselect, requestSelectForPlayer2,
    }));

    const handleClick = () => {
      if (selected || cellOwner !== "none" || disabled || !coordinates) return;
      onCellClick?.(coordinates, name);
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
import React, { useState, forwardRef, useImperativeHandle } from "react";
import clsx from "clsx";

interface Coordinates {
  x: number;
  y: number;
  z: number;
}

interface HexCellProps {
  size?: number;
  name?: string;
  owner?: "none" | "p1" | "p2";
  initialSelected?: boolean;
  disabled?: boolean;
  coordinates?: Coordinates;
  onRequestSelectCell?: (coordinates: Coordinates, player: "p1" | "p2") => void;
  onCellPlayed?: (player: "p1" | "p2", playerName: string, coordinate: string) => void;

}

export interface HexCellRef {
  selectByPlayer: () => boolean;
  selectByPlayer2: () => boolean;
  deselect: () => boolean;
  requestSelectForPlayer2: (targetCoordinates: Coordinates) => void;
}

const HexCell = forwardRef<HexCellRef, HexCellProps>(({
  name = "cell",
  size = 60,
  owner = "none",
  initialSelected = false,
  disabled = false,
  coordinates,
  onRequestSelectCell,
  onCellPlayed,
}: HexCellProps, ref) => {
  const [selected, setSelected] = useState(initialSelected);
  const [cellOwner, setCellOwner] = useState(owner);
  const width = size;
  const height = size;
  const CellName = name;

  
const colors = {
    none: {
      bg: "#64748b",        // slate-500
      hover: "#94a3b8",     // slate-400
      sel: "#cbd5e1",       // slate-300
      fg: "#f8fafc",
    },
    p1: {
       bg: "#3b82f6",        // blue-500
      sel: "#60a5fa",
      fg: "#eff6ff",
    },
    p2: {
      bg: "#ef4444",   // red-500
      sel: "#f87171",  // red-400 
      fg: "#fff1f2",   // red-50 (light tint for foreground text, mirrors blue-50)
    },
  };

  const chosen = colors[cellOwner];  



    function gameyCall() {
    //Call API here
    return true; // Simulate 50% success rate
    }

    function selectByPlayer() {
    setSelected(true);
        setCellOwner("p1");
    return true;
    }   
  
    function selectByPlayer2() {
        setSelected(true);
        setCellOwner("p2");
    return true;
    }

     function deselect() {
        setSelected(false);
        setCellOwner("none");
    return true;
    }

    //Call after bot response

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
    if (selected || cellOwner !== "none" ) return;


    if (gameyCall()){

        selectByPlayer();
    }else{
        //deselect();
        selectByPlayer2();
    }

    onCellPlayed?.("p1", "Player 1", name);
   
    var targetCoordinates: Coordinates = { x: 0, y: 6, z: 0 };
    requestSelectForPlayer2(targetCoordinates);
    onCellPlayed?.("p2", "Bot", `(${targetCoordinates.x},${targetCoordinates.y},${targetCoordinates.z})`);
  };




  return (
    <div
      onClick={handleClick}
      className={clsx(
        "hex transition-all select-none cursor-pointer",
        disabled && "cursor-not-allowed opacity-50"
      )}
      style={{
        width: size,
        height: size,
        backgroundColor: selected ? chosen.sel : chosen.bg,
        color: chosen.fg,
        transform: selected ? "scale(1.08)" : "scale(1.0)",
      }}
    >{CellName}</div>
  );
});

HexCell.displayName = "HexCell";

export default HexCell;

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
      bg: "#10b981",        // emerald-500
      sel: "#34d399",       // emerald-400
      fg: "#ecfdf5",
    },
    p2: {
      bg: "#3b82f6",        // blue-500
      sel: "#60a5fa",
      fg: "#eff6ff",
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
    var targetCoordinates: Coordinates = { x: 0, y: 6, z: 0 };
    requestSelectForPlayer2(targetCoordinates);
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

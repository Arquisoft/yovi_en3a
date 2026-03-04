import React, { useState } from "react";
import clsx from "clsx";

interface HexCellProps {
  size?: number;
  name?: string;
  owner?: "none" | "p1" | "p2";
  initialSelected?: boolean;
  disabled?: boolean;
}

export default function HexCell({
  name = "cell",
  size = 60,
  owner = "none",
  initialSelected = false,
  disabled = false,

}: HexCellProps) 
{
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
    function selectByPlayer() {
    //call API
    //return true if player can select, false if not
    return true;
    }   
  const handleClick = async () => {
    if (selected || cellOwner !== "none" ) return;

    if (selectByPlayer()){
        setSelected(true);
        setCellOwner("p1");
    }else{
        setSelected(false);
        setCellOwner("none");
    }
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
}

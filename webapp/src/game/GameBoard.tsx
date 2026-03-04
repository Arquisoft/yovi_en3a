import React from "react";
import HexCell from "./HexCell";

export default function GameBoard() {
  return (
    <div className="board-skin">
        <HexCell owner="p1" name="Player 1" size={70} />
        <HexCell owner="p2" name="Player 2" size={70} />
        <HexCell owner="none" name="Neutral" size={70} />
      </div>  
  );
}
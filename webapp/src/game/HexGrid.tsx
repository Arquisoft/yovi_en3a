import React, { useRef } from "react";
import HexCell, { type HexCellRef } from "./HexCell";
import HexBackground from "../HexBackGround";
import { type Coordinates } from "./boards/Types";

interface HexGridProps {
  boardSize: number;
  cellSize: number;
  cellRefs: React.MutableRefObject<Map<string, HexCellRef>>;
  initialOwners: Map<string, "p1" | "p2">;
  gameId: string | undefined;
  disabledCells?: Set<string>;
  highlightCells?: Map<string, string>; // key → css color, para Tabu etc.
  showNames?: boolean;
  onCellClick: (coordinates: Coordinates, name: string) => void;
  onRequestSelectCell: (coordinates: Coordinates, player: "p1" | "p2") => void;
  onCellPlayed?: (player: "p1" | "p2", playerName: string, coordinate: string) => void;
  onGameOver?: (winner: "p1" | "p2") => void;
}

const HexGrid: React.FC<HexGridProps> = ({
  boardSize,
  cellSize,
  cellRefs,
  initialOwners,
  gameId,
  disabledCells = new Set(),
  highlightCells = new Map(),
  showNames = true,
  onCellClick,
  onRequestSelectCell,
  onCellPlayed,
  onGameOver,
}) => {
  const hexWidth = cellSize * 1.05;
  const hexHeight = cellSize * 0.8;

  const coordinates = React.useMemo(() => {
    const coords: Coordinates[] = [];
    for (let row = 0; row < boardSize; row++) {
      const x = boardSize - 1 - row;
      for (let y = 0; y <= row; y++) {
        coords.push({ x, y, z: row - y });
      }
    }
    return coords;
  }, [boardSize]);

  const getHexPosition = (row: number, col: number) => {
    const totalRowWidth = row * hexWidth + cellSize;
    const boardWidth = (boardSize - 1) * hexWidth + cellSize;
    const offset = (boardWidth - totalRowWidth) / 2;
    return { left: col * hexWidth + offset, top: row * hexHeight };
  };

  const lastRowPos = getHexPosition(boardSize - 1, boardSize - 1);
  const gridWidth = lastRowPos.left + cellSize;
  const gridHeight = (boardSize - 1) * hexHeight + cellSize;

  return (
    <div className="board-skin flex justify-center items-start p-5">
      <HexBackground opacity={0.7} />
      <div className="board-grid" style={{ position: "relative", width: `${gridWidth}px`, height: `${gridHeight}px` }}>
        {coordinates.map((coord) => {
          const pos = getHexPosition(boardSize - 1 - coord.x, coord.y);
          const key = `${coord.x}-${coord.y}-${coord.z}`;
          const savedOwner = initialOwners.get(key) ?? "none";
          const isDisabled = disabledCells.has(key);
          const highlight = highlightCells.get(key);

          return (
            <div
              key={key}
              className="hex-cell-wrapper"
              style={{
                position: "absolute",
                left: `${pos.left}px`,
                top: `${pos.top}px`,
                filter: highlight ? `drop-shadow(0 0 6px ${highlight})` : "none",
              }}
            >
              <HexCell
                ref={(el) => { if (el) cellRefs.current.set(key, el); }}
                size={cellSize}
                name={`(${coord.x},${coord.y},${coord.z})`}
                owner={savedOwner}
                initialSelected={savedOwner !== "none"}
                disabled={isDisabled}
                coordinates={coord}
                showNames={showNames}
                onRequestSelectCell={onRequestSelectCell}
                onCellClick={onCellClick}
                onCellPlayed={onCellPlayed}
                gameId={gameId}
                onGameOver={onGameOver}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default HexGrid;
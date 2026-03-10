import React, { useRef, forwardRef, useImperativeHandle } from "react";
import HexCell, { type HexCellRef } from "./HexCell";

interface Coordinates {
  x: number;
  y: number;
  z: number;
}

interface GameBoardProps {
  boardSize?: number;
  cellSize?: number;
  gameId?: string;
  onCellPlayed?: (player: "p1" | "p2", playerName: string, coordinate: string) => void;
  onGameOver?: (winner: "p1" | "p2") => void;
}

export interface GameBoardRef {
  selectCellByCoordinates: (x: number, y: number, z: number, player: "p1" | "p2") => boolean;
}

const GameBoard = forwardRef<GameBoardRef, GameBoardProps>((
  { boardSize = 7, cellSize = 60,gameId, onCellPlayed, onGameOver }: GameBoardProps,
  ref
) => {
  const hexSize = cellSize / 2;
//  const hexWidth = cellSize * 0.75;
  const hexWidth = cellSize *1.05;

//  const hexHeight = cellSize * 0.866;
  const hexHeight = cellSize * 0.8;

  /**
   * Generate all valid coordinates for the board.
   * Uses barycentric coordinates where x + y + z = boardSize - 1
   * Layout follows rows from top to bottom:
   *   Row r: x = boardSize-1-r, y ∈ [0..r], z = r-y
   */
  const generateCoordinates = (): Coordinates[] => {
    const coords: Coordinates[] = [];
    for (let row = 0; row < boardSize; row++) {
      const x = boardSize - 1 - row;
      for (let y = 0; y <= row; y++) {
        const z = row - y;
        coords.push({ x, y, z });
      }
    }
    return coords;
  };

  const coordinates = generateCoordinates();
  const cellRefs = useRef<Map<string, HexCellRef>>(new Map());


  const getHexPosition = (row: number, col: number) => {
    const totalRowWidth = row * hexWidth + cellSize;        // width of current row
    const boardWidth = (boardSize - 1) * hexWidth + cellSize; // width of bottom row
    const offset = (boardWidth - totalRowWidth) / 2;        // center offset
    const left = col * hexWidth + offset;
    const top = row * hexHeight;
    return { left, top };
  };

  // Calculate grid dimensions
  const lastRowMaxCol = boardSize - 1;
  const lastRowPos = getHexPosition(boardSize - 1, lastRowMaxCol);
  const gridWidth = lastRowPos.left + cellSize;
  const gridHeight = (boardSize - 1) * hexHeight + cellSize;

  // Expose method to select cell by coordinates
  useImperativeHandle(ref, () => ({
    selectCellByCoordinates: (x: number, y: number, z: number, player: "p1" | "p2") => {
      const key = `${x}-${y}-${z}`;
      const cellRef = cellRefs.current.get(key);
      if (cellRef) {
        return player === "p1" ? cellRef.selectByPlayer() : cellRef.selectByPlayer2();
      }
      return false;
    },
  }));

  // Handler for when a cell requests to select another cell
  const handleRequestSelectCell = (coordinates: Coordinates, player: "p1" | "p2") => {
    const key = `${coordinates.x}-${coordinates.y}-${coordinates.z}`;
    const cellRef = cellRefs.current.get(key);
    if (cellRef) {
      player === "p1" ? cellRef.selectByPlayer() : cellRef.selectByPlayer2();
    }
  };

  return (
    <div className="board-skin flex justify-center items-start p-5">
      <div
        className="board-grid"
        style={{
          width: `${gridWidth}px`,
          height: `${gridHeight}px`,
        }}
      >
        {coordinates.map((coord) => {
          const row = boardSize - 1 - coord.x; 
          const col = coord.y; 
          const pos = getHexPosition(row, col);

          return (
            <div
              key={`${coord.x}-${coord.y}-${coord.z}`}
              className="hex-cell-wrapper"
              style={{
                left: `${pos.left}px`,
                top: `${pos.top}px`,
              }}
            >
              <HexCell
                ref={(el) => {
                  if (el) {
                    cellRefs.current.set(`${coord.x}-${coord.y}-${coord.z}`, el);
                  }
                }}
                size={cellSize}
                name={`(${coord.x},${coord.y},${coord.z})`}
                owner="none"
                initialSelected={false}
                disabled={false}
                coordinates={coord}
                onRequestSelectCell={handleRequestSelectCell}
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
});

GameBoard.displayName = "GameBoard";

export default GameBoard;
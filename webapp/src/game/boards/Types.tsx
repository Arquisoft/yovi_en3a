export interface Coordinates {
  x: number;
  y: number;
  z: number;
}

export interface BoardProps {
  boardSize?: number;
  cellSize?: number;
  gameIdProp?: string;
  onCellPlayed?: (player: "p1" | "p2", playerName: string, coordinate: string) => void;
  onGameOver?: (winner: "p1" | "p2") => void;
}

export interface GameBoardRef {
  selectCellByCoordinates: (x: number, y: number, z: number, player: "p1" | "p2") => boolean;
}

export const parseLayout = (layout: string, boardSize: number): Map<string, "p1" | "p2"> => {
  const occupied = new Map<string, "p1" | "p2">();
  const rows = layout.split("/");
  rows.forEach((row, rowIndex) => {
    const x = boardSize - 1 - rowIndex;
    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      const char = row[colIndex];
      if (char === "B") occupied.set(`${x}-${colIndex}-${rowIndex - colIndex}`, "p1");
      else if (char === "R") occupied.set(`${x}-${colIndex}-${rowIndex - colIndex}`, "p2");
    }
  });
  return occupied;
};
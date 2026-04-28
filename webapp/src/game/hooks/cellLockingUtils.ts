/**
 * Utility functions for cell locking during bot moves
 */

export const generateAllCellKeys = (boardSize: number): Set<string> => {
  const cells = new Set<string>();
  for (let row = 0; row < boardSize; row++) {
    const x = boardSize - 1 - row;
    for (let y = 0; y <= row; y++) {
      const z = row - y;
      cells.add(`${x}-${y}-${z}`);
    }
  }
  return cells;
};

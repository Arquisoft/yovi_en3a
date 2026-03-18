import React, { useRef, forwardRef, useImperativeHandle, useEffect } from "react";
import HexCell, { type HexCellRef } from "./HexCell";
import { useParams } from "react-router-dom";
import HexBackground from "../HexBackGround";

interface Coordinates {
  x: number;
  y: number;
  z: number;
}

interface GameBoardProps {
  boardSize?: number;
  cellSize?: number;
  gameIdProp?: string;
  onCellPlayed?: (player: "p1" | "p2", playerName: string, coordinate: string) => void;
  onGameOver?: (winner: "p1" | "p2") => void;
}

export interface GameBoardRef {
  selectCellByCoordinates: (x: number, y: number, z: number, player: "p1" | "p2") => boolean;
}

const GameBoard = forwardRef<GameBoardRef, GameBoardProps>(
  (
    { boardSize = 7, cellSize = 60, gameIdProp, onCellPlayed, onGameOver }: GameBoardProps,
    ref
  ) => {
    const { gameId: urlGameId } = useParams<{ gameId: string }>();
    const gameId = gameIdProp || urlGameId;

    const hexWidth = cellSize * 1.05;
    const hexHeight = cellSize * 0.8;

    /**
     * Generate all valid coordinates for the board.
     * Uses barycentric coordinates where x + y + z = boardSize - 1
     * Layout follows rows from top to bottom:
     *   Row r: x = boardSize-1-r, y ∈ [0..r], z = r-y
     */
    const coordinates = React.useMemo(() => {
      const coords: Coordinates[] = [];
      for (let row = 0; row < boardSize; row++) {
        const x = boardSize - 1 - row;
        for (let y = 0; y <= row; y++) {
          const z = row - y;
          coords.push({ x, y, z });
        }
      }
      return coords;
    }, [boardSize]);

    const cellRefs = useRef<Map<string, HexCellRef>>(new Map());

    const getHexPosition = (row: number, col: number) => {
      const totalRowWidth = row * hexWidth + cellSize;
      const boardWidth = (boardSize - 1) * hexWidth + cellSize;
      const offset = (boardWidth - totalRowWidth) / 2;
      const left = col * hexWidth + offset;
      const top = row * hexHeight;
      return { left, top };
    };

    const lastRowMaxCol = boardSize - 1;
    const lastRowPos = getHexPosition(boardSize - 1, lastRowMaxCol);
    const gridWidth = lastRowPos.left + cellSize;
    const gridHeight = (boardSize - 1) * hexHeight + cellSize;

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

    const handleRequestSelectCell = (coordinates: Coordinates, player: "p1" | "p2") => {
      const key = `${coordinates.x}-${coordinates.y}-${coordinates.z}`;
      const cellRef = cellRefs.current.get(key);
      if (cellRef) {
        player === "p1" ? cellRef.selectByPlayer() : cellRef.selectByPlayer2();
      }
    };

    useEffect(() => {
      let audio: HTMLAudioElement | null = null;
      try {
        audio = new Audio("/sounds/gameMusic.wav");
        audio.loop = true;
        audio.volume = 0.4;
        audio.play().catch(() => {});
      } catch {
        // Audio not available in test environment
      }

      return () => {
        if (audio) {
          audio.pause();
          audio.currentTime = 0;
        }
      };
    }, []);

    return (
      <div className="board-skin flex justify-center items-start p-5">
        <HexBackground opacity={0.7} />
        <div
          className="board-grid"
          style={{
            position: "relative",
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
                  position: "absolute",
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
  }
);

GameBoard.displayName = "GameBoard";

export default GameBoard;
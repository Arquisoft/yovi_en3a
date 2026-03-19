import React, { useRef, forwardRef, useImperativeHandle, useEffect, useState } from "react";
import HexCell, { type HexCellRef } from "./HexCell";
import { useParams } from "react-router-dom";
import { gatewayUrl } from "../lib/config";
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

// Pasa de yen a un Map de clave "x-y-z" valor "p1" o "p2"
const parseLayout = (layout: string, boardSize: number): Map<string, "p1" | "p2"> => {
  const occupied = new Map<string, "p1" | "p2">();
  const rows = layout.split("/");
  rows.forEach((row, rowIndex) => {
    const x = boardSize - 1 - rowIndex;
    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      const char = row[colIndex];
      if (char === "B") {
        occupied.set(`${x}-${colIndex}-${rowIndex - colIndex}`, "p1");
      } else if (char === "R") {
        occupied.set(`${x}-${colIndex}-${rowIndex - colIndex}`, "p2");
      }
    }
  });
  return occupied;
};

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

    // Almacena el dueño de cada casilla cuando se carga desde el backend
    const [initialOwners, setInitialOwners] = useState<Map<string, "p1" | "p2">>(new Map());

    // Obtiene el estado de la partida del backend y lo restaura
    useEffect(() => {
      if (!gameId) return;
      const token = localStorage.getItem("token");
      fetch(`${gatewayUrl}/api/game-manager/state/${gameId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.yen?.layout) {
            const owners = parseLayout(data.yen.layout, data.yen.size);
            setInitialOwners(owners);
          }
          if (data.status === "won") {
            onGameOver?.("p1");
          } else if (data.status === "lost") {
            onGameOver?.("p2");
          }
        })
        .catch(() => {});
    }, [gameId]);

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
            const key = `${coord.x}-${coord.y}-${coord.z}`;
            const savedOwner = initialOwners.get(key) ?? "none";

            return (
              <div
                key={key}
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
                      cellRefs.current.set(key, el);
                    }
                  }}
                  size={cellSize}
                  name={`(${coord.x},${coord.y},${coord.z})`}
                  owner={savedOwner}
                  initialSelected={savedOwner !== "none"}
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
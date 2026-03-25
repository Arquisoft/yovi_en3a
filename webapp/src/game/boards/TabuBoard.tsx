import React, { useRef, forwardRef, useImperativeHandle, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import HexCell, { type HexCellRef } from "../HexCell";
import HexBackground from "../../HexBackGround";
import { gatewayUrl } from "../../lib/config";
import { type BoardProps, type GameBoardRef, type Coordinates, parseLayout } from "./Types";

const TabuBoard = forwardRef<GameBoardRef, BoardProps>(
  ({ boardSize = 7, cellSize = 60, gameIdProp, onCellPlayed, onGameOver }, ref) => {
    const { gameId: urlGameId } = useParams<{ gameId: string }>();
    const gameId = gameIdProp || urlGameId;

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

    const cellRefs = useRef<Map<string, HexCellRef>>(new Map());
    const [initialOwners, setInitialOwners] = useState<Map<string, "p1" | "p2">>(new Map());

    useEffect(() => {
      if (!gameId) return;
      const token = localStorage.getItem("token");
      fetch(`${gatewayUrl}/api/game-manager/state/${gameId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.yen?.layout) setInitialOwners(parseLayout(data.yen.layout, data.yen.size));
          if (data.status === "won") onGameOver?.("p1");
          else if (data.status === "lost") onGameOver?.("p2");
        })
        .catch(() => {});
    }, [gameId]);

    const getHexPosition = (row: number, col: number) => {
      const totalRowWidth = row * hexWidth + cellSize;
      const boardWidth = (boardSize - 1) * hexWidth + cellSize;
      const offset = (boardWidth - totalRowWidth) / 2;
      return { left: col * hexWidth + offset, top: row * hexHeight };
    };

    const lastRowPos = getHexPosition(boardSize - 1, boardSize - 1);
    const gridWidth = lastRowPos.left + cellSize;
    const gridHeight = (boardSize - 1) * hexHeight + cellSize;

    useImperativeHandle(ref, () => ({
      selectCellByCoordinates: (x, y, z, player) => {
        const cellRef = cellRefs.current.get(`${x}-${y}-${z}`);
        if (cellRef) return player === "p1" ? cellRef.selectByPlayer() : cellRef.selectByPlayer2();
        return false;
      },
    }));

    const handleRequestSelectCell = (coordinates: Coordinates, player: "p1" | "p2") => {
      const cellRef = cellRefs.current.get(`${coordinates.x}-${coordinates.y}-${coordinates.z}`);
      if (cellRef) player === "p1" ? cellRef.selectByPlayer() : cellRef.selectByPlayer2();
    };

    return (
      <div className="board-skin flex justify-center items-start p-5">
        <HexBackground opacity={0.7} />
        <div className="board-grid" style={{ position: "relative", width: `${gridWidth}px`, height: `${gridHeight}px` }}>
          {coordinates.map((coord) => {
            const pos = getHexPosition(boardSize - 1 - coord.x, coord.y);
            const key = `${coord.x}-${coord.y}-${coord.z}`;
            const savedOwner = initialOwners.get(key) ?? "none";
            return (
              <div key={key} className="hex-cell-wrapper" style={{ position: "absolute", left: `${pos.left}px`, top: `${pos.top}px` }}>
                <HexCell
                  ref={(el) => { if (el) cellRefs.current.set(key, el); }}
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

TabuBoard.displayName = "TabuBoard";
export default TabuBoard;
import { useRef, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { gatewayUrl } from "../../lib/config";
import { type Coordinates, type GameBoardRef, type GameLogicOptions, parseLayout } from "../boards/Types";
import { type HexCellRef } from "../HexCell";
import { flushSync } from "react-dom";

export const useGameLogic = (
  gameIdProp: string | undefined,
  boardSize: number,
  onCellPlayed: ((player: "p1" | "p2", playerName: string, coordinate: string) => void) | undefined,
  onGameOver: ((winner: "p1" | "p2") => void) | undefined,
  options?: GameLogicOptions
) => {
  const { gameId: urlGameId } = useParams<{ gameId: string }>();
  const gameId = gameIdProp || urlGameId;

  const cellRefs = useRef<Map<string, HexCellRef>>(new Map());
  const [initialOwners, setInitialOwners] = useState<Map<string, "p1" | "p2">>(new Map());

  // Layout local para comparar sin hacer fetch extra
  const currentLayoutRef = useRef<string>("");

  useEffect(() => {
    if (!gameId) return;
    const token = localStorage.getItem("token");
    fetch(`${gatewayUrl}/api/game-manager/state/${gameId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.yen?.layout) {
          currentLayoutRef.current = data.yen.layout; // guardar layout inicial
          setInitialOwners(parseLayout(data.yen.layout, data.yen.size));
        }
        if (data.status === "won") onGameOver?.("p1");
        else if (data.status === "lost") onGameOver?.("p2");
      })
      .catch(() => {});
  }, [gameId]);

  const selectCell = (x: number, y: number, z: number, player: "p1" | "p2") => {
    const cellRef = cellRefs.current.get(`${x}-${y}-${z}`);
    if (cellRef) return player === "p1" ? cellRef.selectByPlayer() : cellRef.selectByPlayer2();
    return false;
  };

  const handleRequestSelectCell = (coordinates: Coordinates, player: "p1" | "p2") => {
    selectCell(coordinates.x, coordinates.y, coordinates.z, player);
  };

  const handleClick = async (coordinates: Coordinates, name: string) => {
    if (!gameId) return;
    if (options?.onBeforeMove?.() === false) return;

    const token = localStorage.getItem("token");

    flushSync(() => {
      selectCell(coordinates.x, coordinates.y, coordinates.z, "p1");
    });
    onCellPlayed?.("p1", "Player 1", name);
    options?.onAfterPlayerMove?.(coordinates);

    const layoutBefore = currentLayoutRef.current;

    const res = await fetch(`${gatewayUrl}/api/game-manager/game/${gameId}/move`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ coords: { x: coordinates.x, y: coordinates.y } }),
    });

    if (!res.ok) {
      cellRefs.current.get(`${coordinates.x}-${coordinates.y}-${coordinates.z}`)?.deselect();
      return;
    }

    const data = await res.json();
    if (data.yen?.layout) currentLayoutRef.current = data.yen.layout;

    if (data.status === "won" || data.status === "lost") {
      onGameOver?.(data.status === "won" ? "p1" : "p2");
      return;
    }

    if (layoutBefore && data.yen?.layout) {
      const rowsBefore = layoutBefore.split("/");
      const rowsAfter: string[] = data.yen.layout.split("/");

      rowsAfter.forEach((row, rowIndex) => {
        for (let colIndex = 0; colIndex < row.length; colIndex++) {
          if (row[colIndex] === "R" && rowsBefore[rowIndex]?.[colIndex] !== "R") {
            const x = data.yen.size - 1 - rowIndex;
            const y = colIndex;
            const z = rowIndex - colIndex;
            selectCell(x, y, z, "p2");
            onCellPlayed?.("p2", "Bot", `(${x},${y},${z})`);
            options?.onAfterBotMove?.({ x, y, z });
          }
        }
      });
    }
  };

  const gameBoardRef: GameBoardRef = {
    selectCellByCoordinates: (x, y, z, player) => selectCell(x, y, z, player),
  };

  return { gameId, cellRefs, initialOwners, handleClick, handleRequestSelectCell, gameBoardRef };
};
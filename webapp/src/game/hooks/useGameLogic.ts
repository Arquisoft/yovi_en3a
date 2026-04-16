import { useRef, useState, useEffect, useCallback } from "react";
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

  const playedCoords = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!gameId) return;
    const token = localStorage.getItem("token");
    fetch(`${gatewayUrl}/api/game-manager/state/${gameId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.yen?.layout) {
          currentLayoutRef.current = data.yen.layout;
          const owners = parseLayout(data.yen.layout, data.yen.size);
          setInitialOwners(owners);
          playedCoords.current = new Set(owners.keys());
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

  const executeMove = useCallback(async (coordinates: Coordinates, name: string) => {
    if (!gameId) return;
    const token = localStorage.getItem("token");
    const key = `${coordinates.x}-${coordinates.y}-${coordinates.z}`;

    flushSync(() => {
      selectCell(coordinates.x, coordinates.y, coordinates.z, "p1");
    });
    playedCoords.current.add(key);
    onCellPlayed?.("p1", "Player 1", name);
    options?.onAfterPlayerMove?.(coordinates);

    // 1. Petición para aplicar la jugada del jugador
    const playerRes = await fetch(`${gatewayUrl}/api/game-manager/game/${gameId}/move/player`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ coords: { x: coordinates.x, y: coordinates.y } }),
    });

    if (!playerRes.ok) {
      cellRefs.current.get(key)?.deselect();
      playedCoords.current.delete(key);
      return;
    }

    const playerData = await playerRes.json();
    if (playerData.yen?.layout) currentLayoutRef.current = playerData.yen.layout;

    if (playerData.status === "won" || playerData.status === "lost") {
      onGameOver?.(playerData.status === "won" ? "p1" : "p2");
      return;
    }

    // 2. Petición para que el bot haga su jugada
    const layoutBeforeBot = currentLayoutRef.current;

    const botRes = await fetch(`${gatewayUrl}/api/game-manager/game/${gameId}/move/bot`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });

    if (!botRes.ok) return;

    const botData = await botRes.json();
    if (botData.yen?.layout) currentLayoutRef.current = botData.yen.layout;

    if (botData.status === "won" || botData.status === "lost") {
      onGameOver?.(botData.status === "won" ? "p1" : "p2");
      return;
    }

    // Detectar la celda nueva del bot comparando layouts
    if (layoutBeforeBot && botData.yen?.layout) {
      const rowsBefore = layoutBeforeBot.split("/");
      const rowsAfter: string[] = botData.yen.layout.split("/");

      rowsAfter.forEach((row, rowIndex) => {
        for (let colIndex = 0; colIndex < row.length; colIndex++) {
          if (row[colIndex] === "R" && rowsBefore[rowIndex]?.[colIndex] !== "R") {
            const x = botData.yen.size - 1 - rowIndex;
            const y = colIndex;
            const z = rowIndex - colIndex;
            selectCell(x, y, z, "p2");
            playedCoords.current.add(`${x}-${y}-${z}`);
            onCellPlayed?.("p2", "Bot", `(${x},${y},${z})`);
            options?.onAfterBotMove?.({ x, y, z });
          }
        }
      });
    }
  }, [gameId]);

  const handleClick = async (coordinates: Coordinates, name: string) => {
    if (!gameId) return;
    if (options?.onBeforeMove?.() === false) return;
    await executeMove(coordinates, name);
  };

  const makeRandomMove = useCallback(() => {
    const allCoords: Coordinates[] = [];
    for (let row = 0; row < boardSize; row++) {
      const x = boardSize - 1 - row;
      for (let y = 0; y <= row; y++) {
        allCoords.push({ x, y, z: row - y });
      }
    }

    const available = allCoords.filter(
      (c) => !playedCoords.current.has(`${c.x}-${c.y}-${c.z}`)
    );
    if (available.length === 0) return;

    const coord = available[Math.floor(Math.random() * available.length)];
    executeMove(coord, `(${coord.x},${coord.y},${coord.z})`);
  }, [boardSize, executeMove]);

  const gameBoardRef: GameBoardRef = {
    selectCellByCoordinates: (x, y, z, player) => selectCell(x, y, z, player),
    makeRandomMove,
  };

  return { gameId, cellRefs, initialOwners, handleClick, handleRequestSelectCell, gameBoardRef, makeRandomMove };
};
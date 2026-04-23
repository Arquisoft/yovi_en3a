import { useRef, useState, useEffect, useCallback } from "react";
import { useParams } from "react-router-dom";
import { gatewayUrl } from "../../lib/config";
import { type Coordinates, type GameBoardRef, type GameLogicOptions, parseLayout } from "../boards/Types";
import { type HexCellRef } from "../HexCell";
import { flushSync } from "react-dom";

// Se tuvo que añadir aqui por el local no hace llamadas al backend
export const checkYWin = (cells: Set<string>): boolean => {
  const queue: string[] = [];
  const visited = new Set<string>();
  for (const key of cells) {
    if (Number(key.split("-")[1]) === 0) { 
      queue.push(key); visited.add(key); 
    }
  }
  if (queue.length === 0) {
    return false;
  }

  let touchesB = false, touchesC = false, head = 0;
  while (head < queue.length) {
    const curr = queue[head++];
    const [x, y, z] = curr.split("-").map(Number);
    if (z === 0) {
      touchesB = true;
    }
    if (x === 0) {
      touchesC = true;
    }
    if (touchesB && touchesC) {
      return true;
    }

    for (const [nx,ny,nz] of [[x+1,y-1,z],[x+1,y,z-1],[x,y+1,z-1],[x,y-1,z+1],[x-1,y+1,z],[x-1,y,z+1]] as [number,number,number][]) {
      const nk = `${nx}-${ny}-${nz}`;
      if (nx >= 0 && ny >= 0 && nz >= 0 && cells.has(nk) && !visited.has(nk)) {
        visited.add(nk); queue.push(nk);
      }
    }
  }
  return touchesB && touchesC;
};

interface SavedState {
  p1: string[];
  p2: string[];
  isP2Turn: boolean;
}

function loadState(key: string): SavedState | null {
  try { return JSON.parse(localStorage.getItem(key) ?? "null"); } catch { return null; }
}

function saveState(key: string, s: SavedState) {
  try { localStorage.setItem(key, JSON.stringify(s)); } catch {}
}

export const useGameLogic = (
  gameIdProp: string | undefined,
  boardSize: number,
  onCellPlayed: ((player: "p1" | "p2", playerName: string, coordinate: string) => void) | undefined,
  onGameOver: ((winner: "p1" | "p2") => void) | undefined,
  options?: GameLogicOptions
) => {
  const { gameId: urlGameId } = useParams<{ gameId: string }>();
  const gameId = gameIdProp || urlGameId;
  const storageKey = `mp_board_${gameId}`;

  const cellRefs = useRef<Map<string, HexCellRef>>(new Map());
  const [initialOwners, setInitialOwners] = useState<Map<string, "p1" | "p2">>(new Map());
  const currentLayoutRef = useRef<string>("");
  const playedCoords = useRef<Set<string>>(new Set());
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const p1CellsRef = useRef<Set<string>>(new Set());
  const p2CellsRef = useRef<Set<string>>(new Set());
  const isP2TurnRef = useRef(false);
  const [isP2Turn, setIsP2Turn] = useState(false);

  useEffect(() => {
    if (!gameId) {
      return;
    }

    if (optionsRef.current?.isMultiplayer) {
      const saved = loadState(storageKey);
      if (saved && (saved.p1.length > 0 || saved.p2.length > 0)) {
        const owners = new Map<string, "p1" | "p2">();
        saved.p1.forEach(k => { owners.set(k, "p1"); p1CellsRef.current.add(k); playedCoords.current.add(k); });
        saved.p2.forEach(k => { owners.set(k, "p2"); p2CellsRef.current.add(k); playedCoords.current.add(k); });
        setInitialOwners(owners);
        isP2TurnRef.current = saved.isP2Turn;
        setIsP2Turn(saved.isP2Turn);
      }
      return;
    }

    const token = localStorage.getItem("token");
    fetch(`${gatewayUrl}/api/game-manager/state/${gameId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(res => res.json())
      .then(data => {
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

  const executeP1MoveLocal = useCallback((coordinates: Coordinates, name: string) => {
    const key = `${coordinates.x}-${coordinates.y}-${coordinates.z}`;
    if (playedCoords.current.has(key)) {
      return;
    }

    flushSync(() => { selectCell(coordinates.x, coordinates.y, coordinates.z, "p1"); });
    playedCoords.current.add(key);
    p1CellsRef.current.add(key);
    onCellPlayed?.("p1", "Player 1", name);
    optionsRef.current?.onAfterPlayerMove?.(coordinates);

    if (checkYWin(p1CellsRef.current)) { 
      onGameOver?.("p1"); return; 
    }

    if (!optionsRef.current?.skipBotAfterMove) {
      isP2TurnRef.current = true;
      setIsP2Turn(true);
      saveState(storageKey, { p1: [...p1CellsRef.current], p2: [...p2CellsRef.current], isP2Turn: true });
    }
  }, [onCellPlayed, onGameOver, storageKey]);

  const executeP2Move = useCallback((coordinates: Coordinates, name: string) => {
    const key = `${coordinates.x}-${coordinates.y}-${coordinates.z}`;
    if (playedCoords.current.has(key)) {
      return;
    }

    flushSync(() => { selectCell(coordinates.x, coordinates.y, coordinates.z, "p2"); });
    playedCoords.current.add(key);
    p2CellsRef.current.add(key);
    onCellPlayed?.("p2", "Player 2", name);

    if (checkYWin(p2CellsRef.current)) { 
      onGameOver?.("p2"); return; 
    }

    isP2TurnRef.current = false;
    setIsP2Turn(false);
    optionsRef.current?.onAfterBotMove?.(coordinates);
    saveState(storageKey, { p1: [...p1CellsRef.current], p2: [...p2CellsRef.current], isP2Turn: false });
  }, [onCellPlayed, onGameOver, storageKey]);

  const executeMove = useCallback(async (coordinates: Coordinates, name: string) => {
    if (!gameId) {
      return;
    }
    
    const token = localStorage.getItem("token");
    const key = `${coordinates.x}-${coordinates.y}-${coordinates.z}`;

    flushSync(() => { selectCell(coordinates.x, coordinates.y, coordinates.z, "p1"); });
    playedCoords.current.add(key);
    onCellPlayed?.("p1", "Player 1", name);
    optionsRef.current?.onAfterPlayerMove?.(coordinates);

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
    if (playerData.yen?.layout) {
      currentLayoutRef.current = playerData.yen.layout;
    }
    if (playerData.status === "won" || playerData.status === "lost") {
      onGameOver?.(playerData.status === "won" ? "p1" : "p2"); return;
    }
    if (optionsRef.current?.skipBotAfterMove) {
      return;
    }

    const layoutBeforeBot = currentLayoutRef.current;
    const botRes = await fetch(`${gatewayUrl}/api/game-manager/game/${gameId}/move/bot`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });

    if (!botRes.ok) {
      return;
    }

    const botData = await botRes.json();
    if (botData.yen?.layout) {
      currentLayoutRef.current = botData.yen.layout;
    }
    if (botData.status === "won" || botData.status === "lost") {
      onGameOver?.(botData.status === "won" ? "p1" : "p2"); return;
    }

    if (layoutBeforeBot && botData.yen?.layout) {
      botData.yen.layout.split("/").forEach((row: string, rowIndex: number) => {
        for (let colIndex = 0; colIndex < row.length; colIndex++) {
          if (row[colIndex] === "R" && layoutBeforeBot.split("/")[rowIndex]?.[colIndex] !== "R") {
            const x = botData.yen.size - 1 - rowIndex, y = colIndex, z = rowIndex - colIndex;
            selectCell(x, y, z, "p2");
            playedCoords.current.add(`${x}-${y}-${z}`);
            onCellPlayed?.("p2", "Bot", `(${x},${y},${z})`);
            optionsRef.current?.onAfterBotMove?.({ x, y, z });
          }
        }
      });
    }
  }, [gameId]);

  const executeBotMove = useCallback(async (layoutBeforeOverride?: string) => {
    if (!gameId) return;
    const token = localStorage.getItem("token");
    const layoutBefore = layoutBeforeOverride ?? currentLayoutRef.current;

    const res = await fetch(`${gatewayUrl}/api/game-manager/game/${gameId}/move/bot`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;

    const data = await res.json();
    if (data.yen?.layout) currentLayoutRef.current = data.yen.layout;
    if (data.status === "won" || data.status === "lost") {
      onGameOver?.(data.status === "won" ? "p1" : "p2"); return;
    }

    data.yen.layout.split("/").forEach((row: string, rowIndex: number) => {
      for (let colIndex = 0; colIndex < row.length; colIndex++) {
        if (row[colIndex] === "R" && layoutBefore.split("/")[rowIndex]?.[colIndex] !== "R") {
          const x = data.yen.size - 1 - rowIndex, y = colIndex, z = rowIndex - colIndex;
          selectCell(x, y, z, "p2");
          playedCoords.current.add(`${x}-${y}-${z}`);
          onCellPlayed?.("p2", "Bot", `(${x},${y},${z})`);
          optionsRef.current?.onAfterBotMove?.({ x, y, z });
        }
      }
    });
  }, [gameId]);

  const handleClick = (coordinates: Coordinates, name: string) => {
    if (optionsRef.current?.isMultiplayer) {
      if (isP2TurnRef.current) {
        executeP2Move(coordinates, name);
      } else {
        if (optionsRef.current?.onBeforeMove?.() === false) return;
        executeP1MoveLocal(coordinates, name);
      }
    } else {
      if (!gameId) {
        return;
      }
      if (optionsRef.current?.onBeforeMove?.() === false) {
        return;
      }

      executeMove(coordinates, name);
    }
  };

  const availableCoords = useCallback((): Coordinates[] => {
    const all: Coordinates[] = [];
    for (let row = 0; row < boardSize; row++) {
      const x = boardSize - 1 - row;
      for (let y = 0; y <= row; y++) all.push({ x, y, z: row - y });
    }
    return all.filter(c => !playedCoords.current.has(`${c.x}-${c.y}-${c.z}`));
  }, [boardSize]);

  const makeRandomMove = useCallback(() => {
    const available = availableCoords();
    if (available.length === 0) {
      return;
    } 
    
    const coord = available[Math.floor(Math.random() * available.length)];
    executeMove(coord, `(${coord.x},${coord.y},${coord.z})`);
  }, [availableCoords, executeMove]);

  const makeRandomP2Move = useCallback(() => {
    const available = availableCoords();
    if (available.length === 0) {
      return;
    }

    const coord = available[Math.floor(Math.random() * available.length)];
    executeP2Move(coord, `(${coord.x},${coord.y},${coord.z})`);
  }, [availableCoords, executeP2Move]);

  const gameBoardRef: GameBoardRef = {
    selectCellByCoordinates: (x, y, z, player) => selectCell(x, y, z, player),
    makeRandomMove,
    makeRandomP2Move,
  };

  return {
    gameId, cellRefs, initialOwners, handleClick, handleRequestSelectCell,
    gameBoardRef, makeRandomMove, makeRandomP2Move,
    executeMove, executeP1MoveLocal, executeP2Move, executeBotMove,
    currentLayoutRef, playedCoords, selectCell,
    isP2Turn, isP2TurnRef, setIsP2Turn,
    p1CellsRef, p2CellsRef,
  };
};

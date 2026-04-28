import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { checkYWin, useGameLogic } from '../game/hooks/useGameLogic';

vi.mock('react-router-dom', () => ({
  useParams: vi.fn().mockReturnValue({ gameId: 'url-game-id' }),
}));

vi.mock('react-dom', () => ({
  flushSync: (fn: () => void) => fn(),
}));

vi.mock('../../Game/Hooks/cellLockingUtils', () => ({
  generateAllCellKeys: vi.fn().mockReturnValue(new Set<string>()),
}));

vi.mock('../../lib/config', () => ({
  gatewayUrl: 'http://localhost:8000',
}));

// ─── checkYWin unit tests ──────────────────────────────────────────────────────

describe('checkYWin', () => {
  it('returns false for an empty set', () => {
    expect(checkYWin(new Set())).toBe(false);
  });

  it('returns false when no cell touches row y=0', () => {
    const cells = new Set(['1-1-0', '1-2-1']);
    expect(checkYWin(cells)).toBe(false);
  });

  it('returns false when path only touches one side', () => {
    // touches y=0 (start) and z=0 (side B) but not x=0 (side C)
    const cells = new Set(['1-0-1', '1-0-0']);
    expect(checkYWin(cells)).toBe(false);
  });

  it('returns true for a minimal 3-corner path', () => {
    // y=0 row; z=0 side; x=0 side – all in one connected component
    // Cell 0-0-0: y=0 (start), z=0 (touchesB), x=0 (touchesC)
    const cells = new Set(['0-0-0']);
    expect(checkYWin(cells)).toBe(true);
  });

  it('returns true for a connected path spanning both sides', () => {
    // Build a path: start at y=0, reach z=0 and x=0 via neighbors
    // (1,0,1) y=0 → (0,0,2) x=0 → (0,1,1) → (0,2,0) z=0
    const cells = new Set(['1-0-1', '0-0-2', '0-1-1', '0-2-0']);
    expect(checkYWin(cells)).toBe(true);
  });

  it('returns false when y=0 cells are disconnected from z=0 side', () => {
    const cells = new Set([
      '2-0-1', // y=0 start
      '0-2-0', // z=0, x=0 – but not reachable
    ]);
    expect(checkYWin(cells)).toBe(false);
  });
});

// ─── useGameLogic hook tests ──────────────────────────────────────────────────

const makeFetchMock = (ok: boolean, data: unknown) =>
  vi.fn().mockResolvedValue({ ok, json: () => Promise.resolve(data) });

const localStorageMock = () => {
  const store: Record<string, string> = {};
  return {
    getItem: (k: string): string | null => store[k] ?? null,
    setItem: (k: string, v: string): void => { store[k] = v; },
    removeItem: (k: string): void => { delete store[k]; },
    clear: (): void => { Object.keys(store).forEach(k => delete store[k]); },
  };
};

describe('useGameLogic – basic state', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'localStorage', { value: localStorageMock(), writable: true });
    global.fetch = makeFetchMock(true, {});
  });

  it('returns gameId from prop when provided', () => {
    const { result } = renderHook(() =>
      useGameLogic('prop-game-id', 4, undefined, undefined)
    );
    expect(result.current.gameId).toBe('prop-game-id');
  });

  it('falls back to url gameId when prop is undefined', () => {
    const { result } = renderHook(() =>
      useGameLogic(undefined, 4, undefined, undefined)
    );
    expect(result.current.gameId).toBe('url-game-id');
  });

  it('starts with isP2Turn = false', () => {
    const { result } = renderHook(() =>
      useGameLogic('game-1', 4, undefined, undefined)
    );
    expect(result.current.isP2Turn).toBe(false);
  });

  it('starts with isProcessing = false and empty lockedCells', () => {
    const { result } = renderHook(() =>
      useGameLogic('game-1', 4, undefined, undefined)
    );
    expect(result.current.isProcessing).toBe(false);
    expect(result.current.lockedCells.size).toBe(0);
  });
});

describe('useGameLogic – multiplayer local mode', () => {
  let ls: ReturnType<typeof localStorageMock>;

  beforeEach(() => {
    vi.clearAllMocks();
    ls = localStorageMock();
    Object.defineProperty(window, 'localStorage', { value: ls, writable: true });
    global.fetch = vi.fn();
  });

  it('does NOT call fetch in multiplayer mode', () => {
    renderHook(() =>
      useGameLogic('mp-game', 4, undefined, undefined, { isMultiplayer: true })
    );
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('restores board state from localStorage if saved', () => {
    const saved = { p1: ['3-0-1'], p2: ['2-1-1'], isP2Turn: true };
    const mockGetItem = vi.fn((k: string) =>
      k === 'mp_board_mp-game' ? JSON.stringify(saved) : null
    );
    ls.getItem = mockGetItem;

    const { result } = renderHook(() =>
      useGameLogic('mp-game', 4, undefined, undefined, { isMultiplayer: true })
    );

    expect(result.current.isP2Turn).toBe(true);
    expect(result.current.p1CellsRef.current.has('3-0-1')).toBe(true);
    expect(result.current.p2CellsRef.current.has('2-1-1')).toBe(true);
  });

  it('executeP1MoveLocal plays a cell and switches turn to p2', () => {
    const onCellPlayed = vi.fn();
    const { result } = renderHook(() =>
      useGameLogic('mp-game', 4, onCellPlayed, undefined, { isMultiplayer: true })
    );

    act(() => {
      result.current.executeP1MoveLocal({ x: 3, y: 0, z: 1 }, '(3,0,1)');
    });

    expect(result.current.isP2Turn).toBe(true);
    expect(result.current.p1CellsRef.current.has('3-0-1')).toBe(true);
    expect(onCellPlayed).toHaveBeenCalledWith('p1', 'Player 1', '(3,0,1)');
  });

  it('executeP1MoveLocal ignores already-played cells', () => {
    const onCellPlayed = vi.fn();
    const { result } = renderHook(() =>
      useGameLogic('mp-game', 4, onCellPlayed, undefined, { isMultiplayer: true })
    );

    act(() => { result.current.executeP1MoveLocal({ x: 3, y: 0, z: 1 }, 'a'); });
    act(() => { result.current.executeP1MoveLocal({ x: 3, y: 0, z: 1 }, 'a'); });

    expect(onCellPlayed).toHaveBeenCalledTimes(1);
  });

  it('executeP2Move plays a cell and switches turn back to p1', () => {
    const onCellPlayed = vi.fn();
    const { result } = renderHook(() =>
      useGameLogic('mp-game', 4, onCellPlayed, undefined, { isMultiplayer: true })
    );

    // Put the game in p2 turn first
    act(() => { result.current.executeP1MoveLocal({ x: 3, y: 0, z: 1 }, 'a'); });
    act(() => { result.current.executeP2Move({ x: 2, y: 1, z: 1 }, 'b'); });

    expect(result.current.isP2Turn).toBe(false);
    expect(result.current.p2CellsRef.current.has('2-1-1')).toBe(true);
    expect(onCellPlayed).toHaveBeenCalledWith('p2', 'Player 2', 'b');
  });

  it('calls onGameOver when p1 wins', () => {
    const onGameOver = vi.fn();
    // Board size 1 → single cell 0-0-0 touches all three Y-sides → instant win
    const { result } = renderHook(() =>
      useGameLogic('mp-game', 1, undefined, onGameOver, { isMultiplayer: true })
    );

    act(() => { result.current.executeP1MoveLocal({ x: 0, y: 0, z: 0 }, 'win'); });

    expect(onGameOver).toHaveBeenCalledWith('p1');
  });

  it('calls onGameOver when p2 wins', () => {
    const onGameOver = vi.fn();
    const { result } = renderHook(() =>
      useGameLogic('mp-game', 1, undefined, onGameOver, { isMultiplayer: true })
    );

    // skip turn management – call executeP2Move directly
    act(() => { result.current.executeP2Move({ x: 0, y: 0, z: 0 }, 'win'); });

    expect(onGameOver).toHaveBeenCalledWith('p2');
  });

  it('onBeforeMove returning false prevents p1 move', () => {
    const onBeforeMove = vi.fn().mockReturnValue(false);
    const onCellPlayed = vi.fn();
    const { result } = renderHook(() =>
      useGameLogic('mp-game', 4, onCellPlayed, undefined, { isMultiplayer: true, onBeforeMove })
    );

    act(() => { result.current.handleClick({ x: 3, y: 0, z: 1 }, 'a'); });

    expect(onCellPlayed).not.toHaveBeenCalled();
  });
});

describe('useGameLogic – skipBotAfterMove option', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'localStorage', { value: localStorageMock(), writable: true });
  });

  it('does not set isP2Turn when skipBotAfterMove is true', () => {
    const { result } = renderHook(() =>
      useGameLogic('mp-game', 4, undefined, undefined, {
        isMultiplayer: true,
        skipBotAfterMove: true,
      })
    );

    act(() => { result.current.executeP1MoveLocal({ x: 3, y: 0, z: 1 }, 'a'); });

    expect(result.current.isP2Turn).toBe(false);
  });
});
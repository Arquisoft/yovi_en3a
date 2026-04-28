import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { usePieLogic } from '../../game/hooks/usePieLogic';
import * as gameLogicModule from '../../game/hooks/useGameLogic';

// Mock de checkYWin
vi.mock('../../game/hooks/useGameLogic', async () => {
  const actual = await vi.importActual('../../game/hooks/useGameLogic');
  return {
    ...actual,
    checkYWin: vi.fn(() => false),
  };
});

// Mock de react-router-dom
vi.mock('react-router-dom', () => ({
  useParams: () => ({ gameId: undefined }),
}));

// Mock del config
vi.mock('../../lib/config', () => ({
  gatewayUrl: 'http://localhost:3000',
}));

// Mock de localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();

Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('usePieLogic', () => {
  const mockOnCellPlayed = vi.fn();
  const mockOnGameOver = vi.fn();
  const mockOnTurnChange = vi.fn();
  const mockOnSwap = vi.fn();

  // Helper para crear un cellRef mockeado
  const createMockCellRef = () => ({
    selectByPlayer: vi.fn().mockReturnValue(true),
    selectByPlayer2: vi.fn().mockReturnValue(true),
    deselect: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    localStorageMock.clear();
    vi.mocked(gameLogicModule.checkYWin).mockReturnValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('debe iniciar en fase p1_first', () => {
    const { result } = renderHook(() =>
      usePieLogic('test-game', 7, mockOnCellPlayed, mockOnGameOver, mockOnTurnChange, mockOnSwap)
    );

    expect(result.current.phase).toBe('p1_first');
    expect(result.current.currentTurnPlayer).toBe('p1');
  });

  it('debe cambiar a fase p2_choice tras el primer movimiento de P1', () => {
    const { result } = renderHook(() =>
      usePieLogic('test-game', 7, mockOnCellPlayed, mockOnGameOver, mockOnTurnChange, mockOnSwap)
    );

    // Simulamos que el grid ha registrado la referencia de la celda
    const cellKey = '3-3-0';
    result.current.cellRefs.current.set(cellKey, createMockCellRef() as any);

    act(() => {
      result.current.handleClick({ x: 3, y: 3, z: 0 }, 'Center');
    });

    expect(result.current.phase).toBe('p2_choice');
    expect(mockOnTurnChange).toHaveBeenCalledWith('p2');
    expect(result.current.playedCoords.current.has(cellKey)).toBe(true);
  });

  it('debe permitir a P2 hacer SWAP (robar el movimiento de P1)', () => {
    const { result } = renderHook(() =>
      usePieLogic('test-game', 7, mockOnCellPlayed, mockOnGameOver, mockOnTurnChange, mockOnSwap)
    );

    const cellKey = '3-3-0';
    const mockCell = createMockCellRef();
    result.current.cellRefs.current.set(cellKey, mockCell as any);

    // 1. P1 mueve
    act(() => {
      result.current.handleClick({ x: 3, y: 3, z: 0 }, 'Center');
    });

    // 2. P2 elige SWAP
    act(() => {
      result.current.handleSwap();
      vi.runAllTimers(); // Para el setTimeout(0) que cambia el color
    });

    expect(result.current.swapActive).toBe(true);
    expect(result.current.phase).toBe('playing');
    expect(mockCell.deselect).toHaveBeenCalled();
    expect(mockCell.selectByPlayer2).toHaveBeenCalled(); // Ahora es de P2
    expect(mockOnSwap).toHaveBeenCalled();
  });

  it('debe permitir a P2 elegir KEEP (mantener turnos normales)', () => {
    const { result } = renderHook(() =>
      usePieLogic('test-game', 7, mockOnCellPlayed, mockOnGameOver, mockOnTurnChange, mockOnSwap)
    );

    const cellKey = '3-3-0';
    result.current.cellRefs.current.set(cellKey, createMockCellRef() as any);

    act(() => {
      result.current.handleClick({ x: 3, y: 3, z: 0 }, 'Center');
    });

    act(() => {
      result.current.handleKeep();
    });

    expect(result.current.swapActive).toBe(false);
    expect(result.current.phase).toBe('playing');
    expect(result.current.currentTurnPlayer).toBe('p2');
  });

  it('debe detectar victoria correctamente en fase de juego', () => {
    // Forzamos que la próxima comprobación de victoria devuelva true
    vi.mocked(gameLogicModule.checkYWin).mockReturnValue(true);

    const { result } = renderHook(() =>
      usePieLogic('test-game', 7, mockOnCellPlayed, mockOnGameOver, mockOnTurnChange, mockOnSwap)
    );

    // Saltamos a la fase de juego
    const cellKey1 = '0-0-0';
    result.current.cellRefs.current.set(cellKey1, createMockCellRef() as any);

    act(() => {
      result.current.handleClick({ x: 0, y: 0, z: 0 }, 'C1'); // P1 First
      result.current.handleKeep(); // P2 Choice
    });

    // P2 mueve y gana
    const cellKey = '1-1-0';
    result.current.cellRefs.current.set(cellKey, createMockCellRef() as any);

    act(() => {
      result.current.handleClick({ x: 1, y: 1, z: 0 }, 'Winner Cell');
    });

    expect(mockOnGameOver).toHaveBeenCalledWith('p2');
  });
});
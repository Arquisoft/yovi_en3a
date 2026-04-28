import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { usePieLogic } from '../game/hooks/usePieLogic';
import * as gameLogicModule from '../game/hooks/useGameLogic';

// Mockeamos el motor de victoria para controlar cuándo alguien gana
vi.mock('../game/hooks/useGameLogic', () => ({
  checkYWin: vi.fn(() => false),
}));

describe('usePieLogic', () => {
  const mockOnCellPlayed = vi.fn();
  const mockOnGameOver = vi.fn();
  const mockOnTurnChange = vi.fn();

  // Helper para crear un cellRef mockeado
  const createMockCellRef = () => ({
    selectByPlayer: vi.fn().mockReturnValue(true),
    selectByPlayer2: vi.fn().mockReturnValue(true),
    deselect: vi.fn(),
  });

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it('debe iniciar en fase p1_first', () => {
    const { result } = renderHook(() =>
      usePieLogic(7, mockOnCellPlayed, mockOnGameOver, mockOnTurnChange)
    );

    expect(result.current.phase).toBe('p1_first');
    expect(result.current.currentTurnPlayer).toBe('p1');
  });

  it('debe cambiar a fase p2_choice tras el primer movimiento de P1', () => {
    const { result } = renderHook(() =>
      usePieLogic(7, mockOnCellPlayed, mockOnGameOver, mockOnTurnChange)
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
      usePieLogic(7, mockOnCellPlayed, mockOnGameOver, mockOnTurnChange)
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
  });

  it('debe permitir a P2 elegir KEEP (mantener turnos normales)', () => {
    const { result } = renderHook(() =>
      usePieLogic(7, mockOnCellPlayed, mockOnGameOver, mockOnTurnChange)
    );

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
      usePieLogic(7, mockOnCellPlayed, mockOnGameOver, mockOnTurnChange)
    );

    // Saltamos a la fase de juego
    act(() => {
      result.current.handleClick({ x: 0, y: 0, z: 0 }, 'C1'); // P1 First
      result.current.handleKeep(); // P2 Choice
    });

    // P2 mueve y gana
    const cellKey = '1-1-1';
    result.current.cellRefs.current.set(cellKey, createMockCellRef() as any);

    act(() => {
      result.current.handleClick({ x: 1, y: 1, z: 1 }, 'Winner Cell');
    });

    expect(mockOnGameOver).toHaveBeenCalledWith('p2');
  });
});
import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useTabuLogic } from '../game/hooks/useTabuLogic';
import * as gameLogicModule from '../game/hooks/useGameLogic';

// 1. Mock de la dependencia base
vi.mock('../../game/hooks/useGameLogic', () => ({
    useGameLogic: vi.fn(),
}));

describe('useTabuLogic', () => {
    const mockOnCellPlayed = vi.fn();
    const mockOnGameOver = vi.fn();
    const mockOnTurnChange = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        // 2. Configuramos el mock de useGameLogic
        // Simulamos que al llamar a handleClick, el hook base ejecutaría los callbacks
        vi.mocked(gameLogicModule.useGameLogic).mockImplementation((_id, _size, _played, _over, config) => {
            return {
                cellRefs: { current: new Map() },
                initialOwners: new Map(),
                // Simulamos el comportamiento de realizar un movimiento
                handleClick: (coord: any) => {
                    // En el hook real, useGameLogic llamaría a onAfterPlayerMove
                    config?.onAfterPlayerMove?.(coord);
                },
                gameBoardRef: { reset: vi.fn() },
                lockedCells: new Set<string>(),
            } as any;
        });
    });

    it('debe iniciar con el conjunto de celdas tabú vacío', () => {
        const { result } = renderHook(() =>
            useTabuLogic('test-id', 7, mockOnCellPlayed, mockOnGameOver, mockOnTurnChange)
        );

        expect(result.current.tabuCells.size).toBe(0);
        expect(result.current.highlightCells.size).toBe(0);
    });

    it('debe actualizar las celdas tabú tras un movimiento del jugador', () => {
        const { result } = renderHook(() =>
            useTabuLogic('test-id', 7, mockOnCellPlayed, mockOnGameOver, mockOnTurnChange)
        );

        const moveCoord = { x: 3, y: 3, z: 0 };

        act(() => {
            result.current.handleClick(moveCoord, 'center');
        });

        // Verificamos que se han generado exactamente 6 celdas adyacentes
        expect(result.current.tabuCells.size).toBe(6);

        // Verificamos una coordenada adyacente específica (x+1, y-1, z) -> 4-2-0
        expect(result.current.tabuCells.has('4-2-0')).toBe(true);

        // Verificamos que se aplique el color rojo (#ef4444) en highlightCells
        expect(result.current.highlightCells.get('4-2-0')).toBe('#ef4444');
    });

    it('debe cambiar el turno correctamente tras el movimiento', () => {
        const { result } = renderHook(() =>
            useTabuLogic('test-id', 7, mockOnCellPlayed, mockOnGameOver, mockOnTurnChange)
        );

        act(() => {
            result.current.handleClick({ x: 0, y: 0, z: 0 }, 'cell');
        });

        expect(mockOnTurnChange).toHaveBeenCalledWith('p2');
    });

    it('debe limpiar las celdas viejas y poner nuevas al realizar un segundo movimiento', () => {
        const { result } = renderHook(() =>
            useTabuLogic('test-id', 7, mockOnCellPlayed, mockOnGameOver, mockOnTurnChange)
        );

        // Primer movimiento en el centro
        act(() => {
            result.current.handleClick({ x: 3, y: 3, z: 0 }, 'c1');
        });
        const firstTabus = new Set(result.current.tabuCells);

        // Segundo movimiento en una esquina
        act(() => {
            result.current.handleClick({ x: 0, y: 0, z: 0 }, 'c2');
        });

        // Las nuevas celdas tabú deben ser distintas a las anteriores
        expect(result.current.tabuCells).not.toEqual(firstTabus);
        // Adyacente a 0,0,0 (por ejemplo x+1, y-1 -> 1,-1,0)
        expect(result.current.tabuCells.has('1--1-0')).toBe(true);
    });
});
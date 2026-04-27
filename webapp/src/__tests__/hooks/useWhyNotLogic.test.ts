import { renderHook } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useWhyNotLogic } from '../../Game/Hooks/useWhyNotLogic';
import * as gameLogicModule from '../../Game/Hooks/useGameLogic';

// Mock del hook base
vi.mock('../../game/hooks/useGameLogic', () => ({
    useGameLogic: vi.fn(),
}));

describe('useWhyNotLogic', () => {
    const mockOnCellPlayed = vi.fn();
    const mockOnGameOver = vi.fn();
    const mockOnTurnChange = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe invertir el ganador: si P1 completa la conexión, debe ganar P2', () => {
        // 1. Capturamos la configuración que useWhyNotLogic le pasa al motor base
        let capturedOnGameOver: ((winner: "p1" | "p2") => void) | undefined;

        vi.mocked(gameLogicModule.useGameLogic).mockImplementation(
            (_id, _size, _played, onGameOver, _config) => {
                capturedOnGameOver = onGameOver; // Guardamos la función invertida
                return {
                    cellRefs: { current: new Map() },
                    handleClick: vi.fn(),
                } as any;
            }
        );

        renderHook(() =>
            useWhyNotLogic('test-id', 7, mockOnCellPlayed, mockOnGameOver, mockOnTurnChange)
        );

        // 2. Simulamos que el motor de juego detecta que P1 ha ganado
        if (capturedOnGameOver) {
            capturedOnGameOver('p1');
        }

        // 3. Verificamos que la prop original recibió 'p2' como ganador
        expect(mockOnGameOver).toHaveBeenCalledWith('p2');
    });

    it('debe invertir el ganador si P2 es quien completa la conexión', () => {
        let capturedOnGameOver: ((winner: "p1" | "p2") => void) | undefined;

        vi.mocked(gameLogicModule.useGameLogic).mockImplementation(
            (_id, _size, _played, onGameOver) => {
                capturedOnGameOver = onGameOver;
                return {} as any;
            }
        );

        renderHook(() =>
            useWhyNotLogic('test-id', 7, mockOnCellPlayed, mockOnGameOver, mockOnTurnChange)
        );

        // Si P2 conecta, gana P1
        if (capturedOnGameOver) {
            capturedOnGameOver('p2');
        }

        expect(mockOnGameOver).toHaveBeenCalledWith('p1');
    });
});
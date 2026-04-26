import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useFortuneLogic } from '../../game/hooks/useFortuneLogic';
import * as gameLogicHook from '../../game/hooks/useGameLogic';

// 1. Mock de la dependencia useGameLogic
vi.mock('../../game/hooks/useGameLogic', () => ({
    useGameLogic: vi.fn(),
}));

describe('useFortuneLogic', () => {
    const mockOnCellPlayed = vi.fn();
    const mockOnGameOver = vi.fn();
    const mockOnTurnChange = vi.fn();

    const mockGameLogicBase = {
        cellRefs: { current: new Map() },
        initialOwners: new Map(),
        handleClick: vi.fn(),
        executeBotMove: vi.fn().mockResolvedValue(undefined),
        executeP1MoveLocal: vi.fn(),
        executeP2Move: vi.fn(),
        gameBoardRef: {},
    };

    beforeEach(() => {
        vi.useFakeTimers(); // Habilitamos timers falsos para no tener que esperar tiempos reales en los tests cuando el rollDice usa setTimeout
        vi.clearAllMocks();
        vi.mocked(gameLogicHook.useGameLogic).mockReturnValue(mockGameLogicBase as any);
    });

    afterEach(() => {
        vi.useRealTimers(); // Restauramos timers reales
    });

    it('debe iniciar el lanzamiento de dados al montar', () => {
        const { result } = renderHook(() =>
            useFortuneLogic('test-game', 7, mockOnCellPlayed, mockOnGameOver, mockOnTurnChange)
        );

        // Al montar, isRolling debe ser true por el useEffect
        expect(result.current.isRolling).toBe(true);
    });

    it('debe permitir movimiento del jugador si el dado sale "player"', async () => {
        // Forzamos que el dado salga "player" (Math.random < 0.5)
        vi.spyOn(Math, 'random').mockReturnValue(0.1);

        const { result } = renderHook(() =>
            useFortuneLogic('test-game', 7, mockOnCellPlayed, mockOnGameOver, mockOnTurnChange)
        );

        // Avanzamos el tiempo del primer setTimeout (800ms)
        act(() => {
            vi.advanceTimersByTime(800);
        });

        expect(result.current.diceResult).toBe('player');
        expect(result.current.isRolling).toBe(false);
        expect(result.current.playerCanMove).toBe(true);
        expect(mockOnTurnChange).toHaveBeenCalledWith('p1');
    });

    it('debe ejecutar movimiento del bot automáticamente si el dado sale "bot"', async () => {
        // Forzamos que el dado salga "bot"
        vi.spyOn(Math, 'random').mockReturnValue(0.9);

        const { result } = renderHook(() =>
            useFortuneLogic('test-game', 7, mockOnCellPlayed, mockOnGameOver, mockOnTurnChange)
        );

        // Avanzamos el primer timer (800ms del dado)
        await act(async () => {
            vi.advanceTimersByTime(800);
        });

        expect(result.current.diceResult).toBe('bot');
        expect(mockGameLogicBase.executeBotMove).toHaveBeenCalled();

        // Avanzamos el segundo timer (600ms después del bot para re-roll)
        act(() => {
            vi.advanceTimersByTime(600);
        });

        // Debería estar rodando otra vez
        expect(result.current.isRolling).toBe(true);
    });

    it('en multiplayer, debe ser el turno de P2 si el dado sale bot', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0.9);

        const { result } = renderHook(() =>
            useFortuneLogic('test-game', 7, mockOnCellPlayed, mockOnGameOver, mockOnTurnChange, true)
        );

        act(() => {
            vi.advanceTimersByTime(800);
        });

        expect(result.current.isP2TurnLocal).toBe(true);
        expect(mockOnTurnChange).toHaveBeenCalledWith('p2');
    });

    it('handleClick debe llamar a la lógica y reiniciar el ciclo del dado', () => {
        vi.spyOn(Math, 'random').mockReturnValue(0.1); // Turno jugador

        const { result } = renderHook(() =>
            useFortuneLogic('test-game', 7, mockOnCellPlayed, mockOnGameOver, mockOnTurnChange)
        );

        // Pasamos el tiempo del dado inicial
        act(() => {
            vi.advanceTimersByTime(800);
        });

        // El jugador hace clic
        act(() => {
            result.current.handleClick({ x: 0, y: 0, z: 0 }, 'cell');
        });

        expect(mockGameLogicBase.handleClick).toHaveBeenCalled();

        // Verificamos que tras el movimiento (600ms), el dado vuelve a rodar
        act(() => {
            vi.advanceTimersByTime(600);
        });
        expect(result.current.isRolling).toBe(true);
    });
});
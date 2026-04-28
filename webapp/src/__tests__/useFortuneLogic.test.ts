import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { useFortuneLogic } from '../game/hooks/useFortuneLogic';
import * as gameLogicHook from '../game/hooks/useGameLogic';

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
        isProcessing: false,
    };

    let getRandomValuesSpy: any;

    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        vi.mocked(gameLogicHook.useGameLogic).mockReturnValue(mockGameLogicBase as any);
    });

    afterEach(() => {
        vi.useRealTimers();
        if (getRandomValuesSpy) {
            getRandomValuesSpy.mockRestore();
        }
    });

    it('debe iniciar el lanzamiento de dados al montar', () => {
        const { result } = renderHook(() =>
            useFortuneLogic('test-game', 7, mockOnCellPlayed, mockOnGameOver, mockOnTurnChange)
        );

        expect(result.current.isRolling).toBe(true);
    });

    it('debe permitir movimiento del jugador si el dado sale "player"', async () => {
        // Mock crypto.getRandomValues para que devuelva < 128 (player)
        getRandomValuesSpy = vi.spyOn(crypto, 'getRandomValues').mockImplementation((arr: any) => {
            arr[0] = 50; // < 128 = player
            return arr;
        });

        const { result } = renderHook(() =>
            useFortuneLogic('test-game', 7, mockOnCellPlayed, mockOnGameOver, mockOnTurnChange)
        );

        act(() => {
            vi.advanceTimersByTime(800);
        });

        expect(result.current.diceResult).toBe('player');
        expect(result.current.isRolling).toBe(false);
        expect(result.current.playerCanMove).toBe(true);
        expect(mockOnTurnChange).toHaveBeenCalledWith('p1');
    });

    it('debe ejecutar movimiento del bot automáticamente si el dado sale "bot"', async () => {
        // Mock crypto.getRandomValues para que devuelva >= 128 (bot)
        getRandomValuesSpy = vi.spyOn(crypto, 'getRandomValues').mockImplementation((arr: any) => {
            arr[0] = 200; // >= 128 = bot
            return arr;
        });

        const { result } = renderHook(() =>
            useFortuneLogic('test-game', 7, mockOnCellPlayed, mockOnGameOver, mockOnTurnChange)
        );

        await act(async () => {
            vi.advanceTimersByTime(800);
        });

        expect(result.current.diceResult).toBe('bot');
        expect(mockGameLogicBase.executeBotMove).toHaveBeenCalled();

        act(() => {
            vi.advanceTimersByTime(600);
        });

        expect(result.current.isRolling).toBe(true);
    });

    it('en multiplayer, debe ser el turno de P2 si el dado sale bot', () => {
        // Mock crypto.getRandomValues para que devuelva >= 128 (bot/P2)
        getRandomValuesSpy = vi.spyOn(crypto, 'getRandomValues').mockImplementation((arr: any) => {
            arr[0] = 200; // >= 128 = bot
            return arr;
        });

        const { result } = renderHook(() =>
            useFortuneLogic('test-game', 7, mockOnCellPlayed, mockOnGameOver, mockOnTurnChange, true)
        );

        act(() => {
            vi.advanceTimersByTime(800);
        });

        expect(result.current.isP2TurnLocal).toBe(true);
        expect(mockOnTurnChange).toHaveBeenCalledWith('p2');
    });

    it('handleClick debe llamar a la lógica y reiniciar el ciclo del dado', async () => {
        // Mock crypto.getRandomValues para que devuelva < 128 (player)
        getRandomValuesSpy = vi.spyOn(crypto, 'getRandomValues').mockImplementation((arr: any) => {
            arr[0] = 50; // < 128 = player
            return arr;
        });

        const { result } = renderHook(() =>
            useFortuneLogic('test-game', 7, mockOnCellPlayed, mockOnGameOver, mockOnTurnChange, false)
        );

        await act(async () => {
            vi.advanceTimersByTime(800);
        });

        expect(result.current.playerCanMove).toBe(true);
        expect(result.current.diceResult).toBe('player');
        expect(result.current.isRolling).toBe(false);

        await act(async () => {
            result.current.handleClick({ x: 0, y: 0, z: 0 }, 'cell');
        });

        expect(mockGameLogicBase.handleClick).toHaveBeenCalled();
        expect(result.current.playerCanMove).toBe(false);

        await act(async () => {
            vi.advanceTimersByTime(600);
        });
        
        expect(result.current.isRolling).toBe(true);
    });

    it('debe bloquear todas las celdas cuando está rodando el dado', () => {
        const { result } = renderHook(() =>
            useFortuneLogic('test-game', 7, mockOnCellPlayed, mockOnGameOver, mockOnTurnChange)
        );

        // Cuando está rodando, todas las celdas deben estar bloqueadas
        expect(result.current.isRolling).toBe(true);
        expect(result.current.lockedCells.size).toBeGreaterThan(0);
    });

    it('debe desbloquear celdas cuando el jugador puede moverse', async () => {
        getRandomValuesSpy = vi.spyOn(crypto, 'getRandomValues').mockImplementation((arr: any) => {
            arr[0] = 50; // < 128 = player
            return arr;
        });

        const { result } = renderHook(() =>
            useFortuneLogic('test-game', 7, mockOnCellPlayed, mockOnGameOver, mockOnTurnChange)
        );

        await act(async () => {
            vi.advanceTimersByTime(800);
        });

        expect(result.current.playerCanMove).toBe(true);
        expect(result.current.lockedCells.size).toBe(0);
    });
});
import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useMasterLogic } from '../game/hooks/useMasterLogic';
import * as gameLogicModule from '../game/hooks/useGameLogic';

// 1. Mock del hook base
vi.mock('../../game/hooks/useGameLogic', () => ({
    useGameLogic: vi.fn(),
}));

describe('useMasterLogic', () => {
    const mockOnCellPlayed = vi.fn();
    const mockOnGameOver = vi.fn();
    const mockOnTurnChange = vi.fn();

    // Mock del retorno de useGameLogic
    const mockGameLogicBase = {
        cellRefs: { current: new Map() },
        initialOwners: new Map(),
        playedCoords: { current: new Set() },
        handleClick: vi.fn(),
        executeP1MoveLocal: vi.fn(),
        executeP2Move: vi.fn(),
        executeBotMove: vi.fn().mockResolvedValue(undefined),
        gameBoardRef: { reset: vi.fn() },
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(gameLogicModule.useGameLogic).mockReturnValue(mockGameLogicBase as any);
    });

    it('debe requerir dos movimientos antes de cambiar el turno al bot (Single Player)', async () => {
        const { result } = renderHook(() =>
            useMasterLogic('test-game', 7, mockOnCellPlayed, mockOnGameOver, mockOnTurnChange, false)
        );

        // PRIMER MOVIMIENTO
        act(() => {
            result.current.handleClick({ x: 0, y: 0, z: 0 }, 'cell-1');
        });

        expect(result.current.piecesThisTurn).toBe(1);
        expect(result.current.waitingForSecond).toBe(true);
        expect(mockGameLogicBase.executeBotMove).not.toHaveBeenCalled();

        // SEGUNDO MOVIMIENTO
        await act(async () => {
            result.current.handleClick({ x: 1, y: 0, z: -1 }, 'cell-2');
        });

        // Verificamos que se reinicia el contador de piezas
        expect(result.current.piecesThisTurn).toBe(0);
        expect(result.current.waitingForSecond).toBe(false);

        // El bot debe haber movido DOS veces (según la lógica del hook)
        expect(mockGameLogicBase.executeBotMove).toHaveBeenCalledTimes(2);
        expect(mockOnTurnChange).toHaveBeenCalledWith('p2'); // Cambia a bot
        expect(mockOnTurnChange).toHaveBeenCalledWith('p1'); // Vuelve a player
    });

    it('debe cambiar de P1 a P2 tras dos movimientos en modo Multiplayer', () => {
        const { result } = renderHook(() =>
            useMasterLogic('test-game', 7, mockOnCellPlayed, mockOnGameOver, mockOnTurnChange, true)
        );

        // P1 mueve dos veces
        act(() => {
            result.current.handleClick({ x: 0, y: 0, z: 0 }, 'P1-C1');
            result.current.handleClick({ x: 1, y: 0, z: -1 }, 'P1-C2');
        });

        expect(result.current.whosTurn).toBe('p2');
        expect(mockGameLogicBase.executeP1MoveLocal).toHaveBeenCalledTimes(2);
        expect(mockOnTurnChange).toHaveBeenCalledWith('p2');
    });

    it('makeRandomMove debe buscar una coordenada válida y ejecutar el click', () => {
        // Simulamos que ya hay una celda jugada
        mockGameLogicBase.playedCoords.current.add('0-0-0');

        const { result } = renderHook(() =>
            useMasterLogic('test-game', 3, mockOnCellPlayed, mockOnGameOver, mockOnTurnChange)
        );

        act(() => {
            result.current.gameBoardRef.makeRandomMove();
        });

        // Debe haber llamado a handleClick (el de useGameLogic)
        expect(mockGameLogicBase.handleClick).toHaveBeenCalled();
        expect(result.current.piecesThisTurn).toBe(1);
    });

    it('no debe permitir movimiento aleatorio de P2 si no es su turno en multiplayer', () => {
        const { result } = renderHook(() =>
            useMasterLogic('test-game', 7, mockOnCellPlayed, mockOnGameOver, mockOnTurnChange, true)
        );

        // Intentamos mover P2 cuando toca P1
        act(() => {
            result.current.gameBoardRef.makeRandomP2Move();
        });

        expect(mockGameLogicBase.executeP2Move).not.toHaveBeenCalled();
    });
});
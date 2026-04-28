import { renderHook, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useHoleyLogic } from '../../game/hooks/useHoleyLogic'; // Ajusta la ruta si es necesario
import * as gameLogicModule from '../../game/hooks/useGameLogic';

// 1. Mock del hook base
vi.mock('../../game/hooks/useGameLogic', () => ({
    useGameLogic: vi.fn(),
}));

describe('useHoleyLogic', () => {
    const mockOnCellPlayed = vi.fn();
    const mockOnGameOver = vi.fn();
    const mockOnTurnChange = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        // Esto asegura que cualquier llamada a fetch devuelva una promesa válida por defecto
        global.fetch = vi.fn().mockImplementation(() =>
            Promise.resolve({
                ok: true,
                json: () => Promise.resolve({ yen: { holes: [] } }),
            })
        );

        // 3. Mock de localStorage para el token
        const localStorageMock = {
            getItem: vi.fn().mockReturnValue('fake-token'),
            setItem: vi.fn(),
            clear: vi.fn(),
        };
        Object.defineProperty(window, 'localStorage', { value: localStorageMock });

        // 4. Configuración del comportamiento de useGameLogic
        vi.mocked(gameLogicModule.useGameLogic).mockReturnValue({
            cellRefs: { current: new Map() },
            initialOwners: new Map(),
            handleClick: vi.fn(),
            handleRequestSelectCell: vi.fn(),
            executeBotMove: vi.fn().mockResolvedValue(undefined),
            gameBoardRef: { reset: vi.fn() },
            lockedCells: new Set<string>(),
        } as any);
    });

    it('debe cargar agujeros específicos desde la API si es un juego remoto', async () => {
        const mockRemoteHoles = [
            { x: 3, y: 3, z: 0 },
            { x: 2, y: 1, z: 1 }
        ];

        // Forzamos una respuesta específica de la API para este test
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: () => Promise.resolve({ yen: { holes: mockRemoteHoles } }),
        });

        const { result } = renderHook(() =>
            useHoleyLogic('remote-game-id', 7, mockOnCellPlayed, mockOnGameOver, mockOnTurnChange)
        );

        await waitFor(() => {
            expect(result.current.holeCells.has('3-3-0')).toBe(true);
            expect(result.current.holeCells.has('2-1-1')).toBe(true);
            expect(result.current.holeCells.size).toBe(2);
        });
    });

    it('debe generar agujeros aleatorios (fallback) si la API devuelve un error', async () => {
        // Simulamos un error de red o 500
        (global.fetch as any).mockRejectedValueOnce(new Error('Internal Server Error'));

        const { result } = renderHook(() =>
            useHoleyLogic('remote-broken-api', 7, mockOnCellPlayed, mockOnGameOver, mockOnTurnChange)
        );

        await waitFor(() => {
            // El bloque .catch debería haber ejecutado generateHoles
            expect(result.current.holeCells.size).toBeGreaterThan(0);
        }, { timeout: 2000 });
    });

    it('no debe hacer nada si gameIdProp es undefined', () => {
        const { result } = renderHook(() =>
            useHoleyLogic(undefined, 7, mockOnCellPlayed, mockOnGameOver, mockOnTurnChange)
        );

        expect(result.current.holeCells.size).toBe(0);
        expect(global.fetch).not.toHaveBeenCalled();
    });
});
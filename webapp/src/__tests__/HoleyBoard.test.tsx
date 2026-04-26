import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import HoleyBoard from '../game/boards/HoleyBoard';
import * as logicHook from '../game/hooks/useHoleyLogic';
import { MemoryRouter } from 'react-router-dom';

// 1. Mock del hook de lógica
vi.mock('../game/hooks/useHoleyLogic', () => ({
    useHoleyLogic: vi.fn(),
}));

// 2. Mock de HexGrid para verificar las props que recibe
vi.mock('../game/HexGrid', () => ({
    default: ({ disabledCells, highlightCells }: any) => (
        <div data-testid="hex-grid">
            Grid Mock -
            Holes: {disabledCells?.size || 0} -
            Highlights: {highlightCells?.size || 0}
        </div>
    ),
}));

describe('HoleyBoard Component', () => {
    const mockDefaultLogic = {
        cellRefs: { current: new Map() },
        initialOwners: new Map(),
        handleClick: vi.fn(),
        handleRequestSelectCell: vi.fn(),
        gameBoardRef: { reset: vi.fn() },
        holeCells: new Set(['0,0,0']), // Simulamos una celda con hueco
        highlightCells: new Set(['1,-1,0']), // Simulamos una celda resaltada
        isP2Turn: false,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Evitamos el error de desestructuración (undefined)
        vi.mocked(logicHook.useHoleyLogic).mockReturnValue(mockDefaultLogic as any);
    });

    it('debe renderizar el grid con los huecos y resaltados correctos', () => {
        render(
            <MemoryRouter>
                <HoleyBoard boardSize={7} />
            </MemoryRouter>
        );

        const grid = screen.getByTestId('hex-grid');
        expect(grid.textContent).toContain('Holes: 1');
        expect(grid.textContent).toContain('Highlights: 1');
    });

    it('no debe mostrar el indicador de turno en modo single player', () => {
        render(
            <MemoryRouter>
                <HoleyBoard boardSize={7} isMultiplayer={false} />
            </MemoryRouter>
        );

        expect(screen.queryByText(/Player 1's turn/i)).toBeNull();
        expect(screen.queryByText(/Player 2's turn/i)).toBeNull();
    });

    it('debe mostrar el turno de Player 1 en multiplayer', () => {
        vi.mocked(logicHook.useHoleyLogic).mockReturnValue({
            ...mockDefaultLogic,
            isP2Turn: false,
        } as any);

        render(
            <MemoryRouter>
                <HoleyBoard boardSize={7} isMultiplayer={true} />
            </MemoryRouter>
        );

        const turnLabel = screen.getByText(/🟦 Player 1's turn/i);
        expect(turnLabel).toBeDefined();
        // Color azul: #93c5fd -> rgb(147, 197, 243)
        expect(turnLabel.style.color).toBe('rgb(147, 197, 253)');
    });

    it('debe mostrar el turno de Player 2 en multiplayer con el color correcto', () => {
        vi.mocked(logicHook.useHoleyLogic).mockReturnValue({
            ...mockDefaultLogic,
            isP2Turn: true,
        } as any);

        render(
            <MemoryRouter>
                <HoleyBoard boardSize={7} isMultiplayer={true} />
            </MemoryRouter>
        );

        const turnLabel = screen.getByText(/🟥 Player 2's turn/i);
        expect(turnLabel).toBeDefined();
        // Color rojo: #ef4444 -> rgb(239, 68, 68)
        expect(turnLabel.style.color).toBe('rgb(239, 68, 68)');
    });

    it('debe exponer la referencia del juego correctamente', () => {
        const ref = { current: null } as any;
        render(
            <MemoryRouter>
                <HoleyBoard ref={ref} boardSize={7} />
            </MemoryRouter>
        );

        expect(ref.current).toEqual(mockDefaultLogic.gameBoardRef);
    });
});
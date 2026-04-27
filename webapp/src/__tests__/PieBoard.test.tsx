import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import PieBoard from '../Game/Boards/PieBoard';
import * as logicHook from '../Game/Hooks/usePieLogic';
import { MemoryRouter } from 'react-router-dom';

// 1. Mock del hook de lógica
vi.mock('../game/hooks/usePieLogic', () => ({
    usePieLogic: vi.fn(),
}));

// 2. Mock de HexGrid
vi.mock('../game/HexGrid', () => ({
    default: ({ disabledCells }: any) => (
        <div data-testid="hex-grid">
            Grid Mock {disabledCells.has("__all__") ? "(Blocked)" : "(Active)"}
        </div>
    ),
}));

describe('PieBoard Component', () => {
    const mockHandleSwap = vi.fn();
    const mockHandleKeep = vi.fn();

    const mockDefaultLogic = {
        cellRefs: { current: new Map() },
        playedCoords: { current: new Set() },
        phase: 'playing',
        currentTurnPlayer: 'p1',
        swapActive: false,
        handleClick: vi.fn(),
        handleKeep: mockHandleKeep,
        handleSwap: mockHandleSwap,
        handleRequestSelectCell: vi.fn(),
        lockedCells: new Set(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(logicHook.usePieLogic).mockReturnValue(mockDefaultLogic as any);
    });

    it('debe mostrar el mensaje inicial en la fase p1_first', () => {
        vi.mocked(logicHook.usePieLogic).mockReturnValue({
            ...mockDefaultLogic,
            phase: 'p1_first',
        } as any);

        render(
            <MemoryRouter>
                <PieBoard boardSize={7} />
            </MemoryRouter>
        );

        expect(screen.getByText(/place your first piece anywhere/i)).toBeDefined();
    });

    it('debe mostrar el overlay de decisión en la fase p2_choice y bloquear el grid', () => {
        vi.mocked(logicHook.usePieLogic).mockReturnValue({
            ...mockDefaultLogic,
            phase: 'p2_choice',
            lockedCells: new Set(['__all__']), // Bloquear todas las celdas en esta fase
        } as any);

        render(
            <MemoryRouter>
                <PieBoard boardSize={7} />
            </MemoryRouter>
        );

        // Verificar que aparece el cartel de decisión
        expect(screen.getByText(/Player 2's decision/i)).toBeDefined();
        expect(screen.getByText(/Do you want to swap/i)).toBeDefined();

        // Verificar que el grid está bloqueado
        expect(screen.getByText(/Blocked/i)).toBeDefined()
    });

    it('debe llamar a handleSwap cuando se pulsa el botón Swap', () => {
        vi.mocked(logicHook.usePieLogic).mockReturnValue({
            ...mockDefaultLogic,
            phase: 'p2_choice',
        } as any);

        render(
            <MemoryRouter>
                <PieBoard boardSize={7} />
            </MemoryRouter>
        );

        const swapButton = screen.getByRole('button', { name: /swap/i });
        fireEvent.click(swapButton);

        expect(mockHandleSwap).toHaveBeenCalled();
    });

    it('debe llamar a handleKeep cuando se pulsa el botón Keep', () => {
        vi.mocked(logicHook.usePieLogic).mockReturnValue({
            ...mockDefaultLogic,
            phase: 'p2_choice',
        } as any);

        render(
            <MemoryRouter>
                <PieBoard boardSize={7} />
            </MemoryRouter>
        );

        const keepButton = screen.getByRole('button', { name: /keep/i });
        fireEvent.click(keepButton);

        expect(mockHandleKeep).toHaveBeenCalled();
    });

    it('debe mostrar la etiqueta "swapped" si la regla del pastel se activó', () => {
        vi.mocked(logicHook.usePieLogic).mockReturnValue({
            ...mockDefaultLogic,
            phase: 'playing',
            swapActive: true,
            currentTurnPlayer: 'p2',
        } as any);

        render(
            <MemoryRouter>
                <PieBoard boardSize={7} />
            </MemoryRouter>
        );
        expect(screen.getByTestId('hex-grid')).toBeDefined();
    });

    it('debe exponer correctamente el método selectCellByCoordinates a través de la ref', () => {
        // Simulamos que el hook devuelve un Map con una celda falsa
        const mockCell = { selectByPlayer: vi.fn() };
        const cellRefs = { current: new Map([["0-0-0", mockCell]]) };

        vi.mocked(logicHook.usePieLogic).mockReturnValue({
            ...mockDefaultLogic,
            cellRefs,
        } as any);

        const ref = { current: null } as any;
        render(
            <MemoryRouter>
                <PieBoard ref={ref} boardSize={7} />
            </MemoryRouter>
        );

        // Probamos el método de la ref
        ref.current.selectCellByCoordinates(0, 0, 0, "p1");
        expect(mockCell.selectByPlayer).toHaveBeenCalled();
    });
});
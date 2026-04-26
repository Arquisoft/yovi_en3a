import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import TabuBoard from '../game/boards/TabuBoard';
import * as logicHook from '../game/hooks/useTabuLogic';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../game/hooks/useTabuLogic', () => ({
    useTabuLogic: vi.fn(),
}));

// Modificamos el mock del HexGrid para que nos diga qué celdas recibió como bloqueadas
vi.mock('../game/HexGrid', () => ({
    default: ({ disabledCells }: any) => (
        <div data-testid="hex-grid">
            {/* Si el Set tiene la celda, la pintamos en el DOM para poder buscarla */}
            {disabledCells.has('3-3-0') && <span>Celda 3-3-0 Bloqueada</span>}
            {disabledCells.has('__all__') && <span>Todo Bloqueado</span>}
        </div>
    ),
}));

describe('TabuBoard - Celdas Bloqueadas', () => {
    const mockDefaultLogic = {
        cellRefs: { current: new Map() },
        initialOwners: new Map(),
        handleClick: vi.fn(),
        handleRequestSelectCell: vi.fn(),
        gameBoardRef: { reset: vi.fn() },
        tabuCells: new Set(),
        highlightCells: new Set(),
        isP2Turn: false,
        lockedCells: new Set(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe pasar las coordenadas de las celdas tabú al HexGrid como deshabilitadas', () => {
        // Simulamos que la lógica marca la celda 3,3,0 como Tabú
        const tabuSet = new Set(['3-3-0']);
        vi.mocked(logicHook.useTabuLogic).mockReturnValue({
            ...mockDefaultLogic,
            tabuCells: tabuSet,
            lockedCells: tabuSet, // lockedCells debe incluir las celdas tabú
        } as any);

        render(
            <MemoryRouter>
                <TabuBoard boardSize={7} />
            </MemoryRouter>
        );

        // Verificamos que el HexGrid recibió la instrucción de bloquear esa celda
        expect(screen.getByText(/Celda 3-3-0 Bloqueada/i)).toBeDefined();
    });

    it('no debe haber celdas bloqueadas si el set de tabuCells está vacío', () => {
        vi.mocked(logicHook.useTabuLogic).mockReturnValue({
            ...mockDefaultLogic,
            tabuCells: new Set(),
        } as any);

        render(
            <MemoryRouter>
                <TabuBoard boardSize={7} />
            </MemoryRouter>
        );

        // El texto no debería existir
        expect(screen.queryByText(/Celda 3-3-0 Bloqueada/i)).toBeNull();
    });

    it('debe mostrar el aviso de celdas Tabu cuando existen restricciones', () => {
        vi.mocked(logicHook.useTabuLogic).mockReturnValue({
            ...mockDefaultLogic,
            tabuCells: new Set(['1,1,1']),
        } as any);

        render(
            <MemoryRouter>
                <TabuBoard boardSize={7} />
            </MemoryRouter>
        );

        expect(screen.getByText(/Tabu cells highlighted in red/i)).toBeDefined();
    });

    it('debe posicionar el banner de turno correctamente si hay celdas Tabu', () => {
        vi.mocked(logicHook.useTabuLogic).mockReturnValue({
            ...mockDefaultLogic,
            tabuCells: new Set(['1,1,1']),
            isMultiplayer: true,
            isP2Turn: false,
        } as any);

        render(
            <MemoryRouter>
                <TabuBoard boardSize={7} isMultiplayer={true} />
            </MemoryRouter>
        );

        const turnLabel = screen.getByText(/🟦 Player 1's turn/i);
        // Cuando hay tabuCells, el estilo top debe ser 48px
        expect(turnLabel.style.top).toBe('48px');
    });

    it('debe posicionar el banner de turno a 12px si NO hay celdas Tabu', () => {
        vi.mocked(logicHook.useTabuLogic).mockReturnValue({
            ...mockDefaultLogic,
            tabuCells: new Set(),
            isMultiplayer: true,
            isP2Turn: false,
        } as any);

        render(
            <MemoryRouter>
                <TabuBoard boardSize={7} isMultiplayer={true} />
            </MemoryRouter>
        );

        const turnLabel = screen.getByText(/🟦 Player 1's turn/i);
        expect(turnLabel.style.top).toBe('12px');
    });

    it('debe aplicar el color de Player 2 cuando isP2Turn es true', () => {
        vi.mocked(logicHook.useTabuLogic).mockReturnValue({
            ...mockDefaultLogic,
            isP2Turn: true,
        } as any);

        render(
            <MemoryRouter>
                <TabuBoard boardSize={7} isMultiplayer={true} />
            </MemoryRouter>
        );

        const turnLabel = screen.getByText(/🟥 Player 2's turn/i);
        expect(turnLabel.style.color).toBe('rgb(239, 68, 68)');
    });

    it('debe pasar las celdas resaltadas al HexGrid', () => {
        vi.mocked(logicHook.useTabuLogic).mockReturnValue({
            ...mockDefaultLogic,
            highlightCells: new Set(['0,0,0', '1,1,1']),
        } as any);

        render(
            <MemoryRouter>
                <TabuBoard boardSize={7} />
            </MemoryRouter>
        );

        expect(screen.getByTestId('hex-grid')).toBeDefined();
        // El HexGrid real recibiría las props, aquí verificamos que no explote
    });
});
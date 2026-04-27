import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import MasterBoard from '../Game/Boards/MasterBoard';
import * as logicHook from '../Game/Hooks/useMasterLogic';
import { MemoryRouter } from 'react-router-dom';

// 1. Mock del hook de lógica
vi.mock('../game/hooks/useMasterLogic', () => ({
    useMasterLogic: vi.fn(),
}));

// 2. Mock de HexGrid
vi.mock('../game/HexGrid', () => ({
    default: () => <div data-testid="hex-grid">HexGrid Mock</div>,
}));

describe('MasterBoard Component', () => {
    const mockDefaultLogic = {
        cellRefs: { current: new Map() },
        initialOwners: new Map(),
        handleClick: vi.fn(),
        handleRequestSelectCell: vi.fn(),
        gameBoardRef: { reset: vi.fn() },
        piecesThisTurn: 0,
        waitingForSecond: false,
        whosTurn: 'p1',
        isP2Turn: false,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(logicHook.useMasterLogic).mockReturnValue(mockDefaultLogic as any);
    });

    it('debe mostrar el progreso de piezas (1 de 2) en modo single player', () => {
        render(
            <MemoryRouter>
                <MasterBoard boardSize={7} isMultiplayer={false} />
            </MemoryRouter>
        );

        expect(screen.getByText(/Place piece 1 of 2/i)).toBeDefined();
    });

    it('debe mostrar el progreso de piezas (2 de 2) cuando waitingForSecond es true', () => {
        vi.mocked(logicHook.useMasterLogic).mockReturnValue({
            ...mockDefaultLogic,
            waitingForSecond: true,
        } as any);

        render(
            <MemoryRouter>
                <MasterBoard boardSize={7} isMultiplayer={false} />
            </MemoryRouter>
        );

        expect(screen.getByText(/Place piece 2 of 2/i)).toBeDefined();
    });

    it('debe mostrar el turno de Player 1 y su pieza actual en multiplayer', () => {
        vi.mocked(logicHook.useMasterLogic).mockReturnValue({
            ...mockDefaultLogic,
            isMultiplayer: true,
            whosTurn: 'p1',
            piecesThisTurn: 0,
        } as any);

        render(
            <MemoryRouter>
                <MasterBoard boardSize={7} isMultiplayer={true} />
            </MemoryRouter>
        );

        expect(screen.getByText(/Player 1 — Place piece 1 of 2/i)).toBeDefined();
    });

    it('debe mostrar el turno de Player 2 y su segunda pieza en multiplayer', () => {
        vi.mocked(logicHook.useMasterLogic).mockReturnValue({
            ...mockDefaultLogic,
            isMultiplayer: true,
            whosTurn: 'p2',
            piecesThisTurn: 1,
        } as any);

        render(
            <MemoryRouter>
                <MasterBoard boardSize={7} isMultiplayer={true} />
            </MemoryRouter>
        );

        expect(screen.getByText(/Player 2 — Place piece 2 of 2/i)).toBeDefined();
    });

    it('debe renderizar el HexGrid correctamente', () => {
        render(
            <MemoryRouter>
                <MasterBoard boardSize={7} />
            </MemoryRouter>
        );

        expect(screen.getByTestId('hex-grid')).toBeDefined();
    });
});
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import StandardBoard from '../Game/Boards/StandardBoard';
import * as logicHook from '../Game/Hooks/useGameLogic';
import { MemoryRouter } from 'react-router-dom';

// 1. Mock del hook de lógica
vi.mock('../game/hooks/useGameLogic', () => ({
    useGameLogic: vi.fn(),
}));

// 2. Mock de HexGrid
vi.mock('../game/HexGrid', () => ({
    default: () => <div data-testid="hex-grid">HexGrid Mock</div>,
}));

describe('StandardBoard Component', () => {
    const mockDefaultLogic = {
        cellRefs: { current: new Map() },
        initialOwners: new Map(),
        handleClick: vi.fn(),
        handleRequestSelectCell: vi.fn(),
        gameBoardRef: { reset: vi.fn() },
        isP2Turn: false,
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Usamos 'as any' para silenciar errores de tipos en el mock
        vi.mocked(logicHook.useGameLogic).mockReturnValue(mockDefaultLogic as any);
    });

    it('debe renderizar el tablero sin el banner de turno en modo single player', () => {
        render(
            <MemoryRouter>
                <StandardBoard boardSize={7} isMultiplayer={false} />
            </MemoryRouter>
        );

        expect(screen.queryByText(/Player 1's turn/i)).toBeNull();
        expect(screen.getByTestId('hex-grid')).toBeDefined();
    });

    it('debe mostrar el turno de Player 1 en azul cuando es su turno en multiplayer', () => {
        vi.mocked(logicHook.useGameLogic).mockReturnValue({
            ...mockDefaultLogic,
            isP2Turn: false,
        } as any);

        render(
            <MemoryRouter>
                <StandardBoard boardSize={7} isMultiplayer={true} />
            </MemoryRouter>
        );

        const banner = screen.getByText(/🟦 Player 1's turn/i);
        // Color #93c5fd
        expect(banner.style.color).toBe('rgb(147, 197, 253)');
    });

    it('debe mostrar el turno de Player 2 en rojo cuando es su turno en multiplayer', () => {
        vi.mocked(logicHook.useGameLogic).mockReturnValue({
            ...mockDefaultLogic,
            isP2Turn: true,
        } as any);

        render(
            <MemoryRouter>
                <StandardBoard boardSize={7} isMultiplayer={true} />
            </MemoryRouter>
        );

        const banner = screen.getByText(/🟥 Player 2's turn/i);
        // Color #ef4444
        expect(banner.style.color).toBe('rgb(239, 68, 68)');
    });

    it('debe exponer la referencia del juego (imperative handle)', () => {
        const gameRef = { current: null } as any;
        render(
            <MemoryRouter>
                <StandardBoard ref={gameRef} boardSize={7} />
            </MemoryRouter>
        );

        // Verificamos que el objeto expuesto sea el que devuelve el hook
        expect(gameRef.current).toBe(mockDefaultLogic.gameBoardRef);
    });
});
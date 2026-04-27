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
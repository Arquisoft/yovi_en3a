import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import WhyNotBoard from '../game/boards/WhyNotBoard';
import * as logicHook from '../game/hooks/useWhyNotLogic';
import { MemoryRouter } from 'react-router-dom';

// 1. Mock del hook de lógica
vi.mock('../game/hooks/useWhyNotLogic', () => ({
    useWhyNotLogic: vi.fn(),
}));

// 2. Mock de HexGrid
vi.mock('../game/HexGrid', () => ({
    default: () => <div data-testid="hex-grid">HexGrid Mock</div>,
}));

describe('WhyNotBoard Component', () => {
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
        vi.mocked(logicHook.useWhyNotLogic).mockReturnValue(mockDefaultLogic as any);
    });

    it('debe mostrar siempre el mensaje de advertencia sobre las reglas', () => {
        render(
            <MemoryRouter>
                <WhyNotBoard boardSize={7} />
            </MemoryRouter>
        );

        expect(screen.getByText(/First to connect three edges loses/i)).toBeDefined();
    });

    it('no debe mostrar el banner de turno en modo single player', () => {
        render(
            <MemoryRouter>
                <WhyNotBoard boardSize={7} isMultiplayer={false} />
            </MemoryRouter>
        );

        expect(screen.queryByText(/Player 1's turn/i)).toBeNull();
        expect(screen.queryByText(/Player 2's turn/i)).toBeNull();
    });

    it('debe renderizar el HexGrid con las props correctas', () => {
        render(
            <MemoryRouter>
                <WhyNotBoard boardSize={7} />
            </MemoryRouter>
        );

        expect(screen.getByTestId('hex-grid')).toBeDefined();
    });
});
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import FortuneBoard from '../game/boards/FortuneBoard';
import * as logicHook from '../game/hooks/useFortuneLogic';
import { MemoryRouter } from 'react-router-dom';

// 1. Mock del hook
vi.mock('../game/hooks/useFortuneLogic', () => ({
    useFortuneLogic: vi.fn(),
}));

// 2. Mocks de componentes hijos
vi.mock('../game/HexGrid', () => ({
    default: () => <div data-testid="hex-grid">HexGrid Mock</div>,
}));

// Mock realista del DiceRoller que refleja su comportamiento real
vi.mock('../game/boards/DiceRoller/DiceRoller', () => ({
    default: ({ isRolling, diceResult, isMultiplayer }: any) => {
        let statusText = '';
        let color = '#93c5fd';

        if (isRolling) {
            statusText = '🎲 Rolling...';
        } else if (diceResult === 'player') {
            statusText = isMultiplayer ? "🟦 Player 1's turn!" : '🟦 Your turn!';
        } else if (diceResult === 'bot') {
            statusText = isMultiplayer ? "🟥 Player 2's turn" : '🤖 Bot is thinking...';
            color = '#ef4444';
        }

        return (
            <div data-testid="dice-roller" style={{ color }}>
                {statusText}
            </div>
        );
    },
}));

describe('FortuneBoard Component', () => {
    // Objeto base para los mocks
    const mockDefaultLogic = {
        cellRefs: { current: new Map() },
        initialOwners: new Map(),
        handleClick: vi.fn(),
        handleRequestSelectCell: vi.fn(),
        gameBoardRef: { someMethod: vi.fn() },
        diceResult: null,
        isRolling: true,
        playerCanMove: false,
        isP2TurnLocal: false,
        lockedCells: new Set(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(logicHook.useFortuneLogic).mockReturnValue(mockDefaultLogic as any);
    });

    it('debe pasar de "Rolling" a "Your turn" cuando el hook actualiza el estado', async () => {
        const { rerender } = render(
            <MemoryRouter>
                <FortuneBoard boardSize={7} />
            </MemoryRouter>
        );

        expect(screen.getByText(/🎲 Rolling.../i)).toBeDefined();

        // Simulamos cambio a turno del jugador
        vi.mocked(logicHook.useFortuneLogic).mockReturnValue({
            ...mockDefaultLogic,
            isRolling: false,
            diceResult: 'player',
            playerCanMove: true,
        } as any);

        // Re-renderizamos para forzar la lectura del nuevo mock
        rerender(
            <MemoryRouter>
                <FortuneBoard boardSize={7} />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Your turn!/i)).toBeDefined();
        });
    });

    it('debe aplicar el color correcto para el turno de P2', () => {
        vi.mocked(logicHook.useFortuneLogic).mockReturnValue({
            ...mockDefaultLogic,
            isRolling: false,
            diceResult: 'bot',
            isP2TurnLocal: true,
            lockedCells: new Set(),
        } as any);

        const { container } = render(
            <MemoryRouter>
                <FortuneBoard boardSize={7} isMultiplayer={true} />
            </MemoryRouter>
        );

        const statusLabel = screen.getByText(/Player 2's turn/i);
        // RGB de #ef4444
        expect(statusLabel.style.color).toBe('rgb(239, 68, 68)');
    });
});
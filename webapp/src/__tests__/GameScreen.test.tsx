import { vi, describe, expect, beforeEach, test } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom';
import { GameScreen } from '../game/GameScreen';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// ── Mocks globales ──────────────────────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock('../game/GameBoard', () => ({
    default: React.forwardRef((props: any, ref: any) => {
        React.useImperativeHandle(ref, () => ({
            selectCellByCoordinates: vi.fn(),
        }));
        return (
            <div data-testid="mock-gameboard">
                <button onClick={() => props.onCellPlayed?.('p1', 'Player 1', '(0,0,0)')}>
                    Simulate Move
                </button>
                <button onClick={() => props.onGameOver?.('p1')}>Simulate Win</button>
                <button onClick={() => props.onGameOver?.('p2')}>Simulate Loss</button>
            </div>
        );
    }),
}));

vi.mock('../game/SidePanel', () => ({
    default: React.forwardRef((_props: any, ref: any) => {
        React.useImperativeHandle(ref, () => ({
            addMove: vi.fn(),
            incrementTurn: vi.fn(),
        }));
        return <div data-testid="mock-sidepanel" />;
    }),
}));

// ── Helper ──────────────────────────────────────────────────────────────────

const renderWithParams = (gameId = 'test-game-123', size = '7', gameType = 'standard') =>
    render(
        <MemoryRouter initialEntries={[`/game/${gameId}/${size}/${gameType}`]}>
            <Routes>
                <Route path="/game/:gameId/:size/:gameType" element={<GameScreen />} />
            </Routes>
        </MemoryRouter>
    );

// ── Tests ───────────────────────────────────────────────────────────────────

describe('GameScreen Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({}),
        }) as any;
    });

    test('renders board and sidepanel', () => {
        renderWithParams();

        expect(screen.getByTestId('mock-gameboard')).toBeInTheDocument();
        // El SidePanel está oculto, verificamos el header y otros elementos visibles
        expect(screen.getByText('Y-Game')).toBeInTheDocument();
        // Move History puede estar colapsado, verifica que el botón existe
        const moveHistoryButton = screen.getByRole('button', { name: /move history/i });
        expect(moveHistoryButton).toBeInTheDocument();
    });

    test('shows the game type badge in the header', () => {
        renderWithParams('game-1', '7', 'standard');

        // El <header> tiene role="banner"; el badge del gameType está dentro
        const header = screen.getByRole('banner');
        expect(header).toHaveTextContent('standard');
    });

    test('shows board size in the info panel', () => {
        renderWithParams('game-1', '5');

        expect(screen.getByText('5×5')).toBeInTheDocument();
    });

    test('shows victory message when player 1 wins', () => {
        renderWithParams();

        fireEvent.click(screen.getByText('Simulate Win'));

        expect(screen.getByText(/you win/i)).toBeInTheDocument();
        expect(screen.getByText(/congratulations/i)).toBeInTheDocument();
    });

    test('shows defeat message when player 2 wins', () => {
        renderWithParams();

        fireEvent.click(screen.getByText('Simulate Loss'));

        expect(screen.getByText(/you lose/i)).toBeInTheDocument();
        expect(screen.getByText(/better luck next time/i)).toBeInTheDocument();
    });

    test('exit button navigates back', () => {
        renderWithParams();

        // El botón contiene el texto "Exit" (con icono LogOut delante)
        const exitBtn = screen.getByRole('button', { name: /exit/i });
        fireEvent.click(exitBtn);

        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    test('back to menu button works after game over', () => {
        renderWithParams();

        fireEvent.click(screen.getByText('Simulate Win'));

        const backBtn = screen.getByRole('button', { name: /back to menu/i });
        fireEvent.click(backBtn);

        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    test('increments turn number and piece count on move', () => {
        renderWithParams();

        // Turn inicial = 1
        const turnElements = screen.getAllByText('1');
        // Verificar que existe al menos un elemento con "1"
        expect(turnElements.length).toBeGreaterThan(0);

        fireEvent.click(screen.getByText('Simulate Move'));

        // Tras el movimiento de p1, el turno sube a 2
        const turnElements2 = screen.getAllByText('2');
        expect(turnElements2.length).toBeGreaterThan(0);
    });

    test('does not show game over overlay initially', () => {
        renderWithParams();

        expect(screen.queryByText(/you win/i)).not.toBeInTheDocument();
        expect(screen.queryByText(/you lose/i)).not.toBeInTheDocument();
    });

    test('calls onExit prop when provided instead of navigate', () => {
        const onExitMock = vi.fn();

        render(
            <MemoryRouter initialEntries={['/game/abc/7/standard']}>
                <Routes>
                    <Route
                        path="/game/:gameId/:size/:gameType"
                        element={<GameScreen onExit={onExitMock} />}
                    />
                </Routes>
            </MemoryRouter>
        );

        fireEvent.click(screen.getByRole('button', { name: /exit/i }));

        expect(onExitMock).toHaveBeenCalled();
        expect(mockNavigate).not.toHaveBeenCalled();
    });
});
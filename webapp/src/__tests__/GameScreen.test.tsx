import { vi, describe, it, expect, beforeEach, test } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import '@testing-library/jest-dom'
import { GameScreen } from '../GameScreen';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

const mockNavigate = vi.fn();


vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// 1. Mock GameBoard with forwardRef support
vi.mock('../game/GameBoard', () => {
    return {
        default: React.forwardRef((props: any, ref: any) => {
            // This mimics the 'useImperativeHandle' in your real component
            // so the parent doesn't crash if it tries to access the ref.
            React.useImperativeHandle(ref, () => ({
                selectCellByCoordinates: vi.fn(),
            }));

            return (
                <div data-testid="mock-gameboard">
                    {/* We use 'p1' and 'p2' because your real component uses those strings */}
                    <button onClick={() => props.onGameOver('p1')}>Simulate Win</button>
                    <button onClick={() => props.onGameOver('p2')}>Simulate Loss</button>
                </div>
            );
        }),
    };
});

// 2. Mock SidePanel
vi.mock('../game/SidePanel', () => ({
    default: () => <div data-testid="mock-sidepanel" />,
}));

describe('GameScreen Component', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    const renderWithParams = (gameId = 'test-game-123', size = '7') => {
        return render(
            <MemoryRouter initialEntries={[`/game/${gameId}/${size}`]}>
                <Routes>
                    <Route path="/game/:gameId/:size" element={<GameScreen />} />
                </Routes>
            </MemoryRouter>
        );
    };

    test('renders board and sidepanel mocks', () => {
        renderWithParams();

        expect(screen.getByTestId('mock-gameboard')).toBeInTheDocument();
        expect(screen.getByTestId('mock-sidepanel')).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: /game/i })).toBeInTheDocument();
    });

    test('shows victory message when player 1 wins', () => {
        renderWithParams();

        fireEvent.click(screen.getByText('Simulate Win'));

        expect(screen.getByText(/You win/i)).toBeInTheDocument();
        expect(screen.getByText(/Congratulations/i)).toBeInTheDocument();
    });

    test('shows defeat message when player 2 wins', () => {
        renderWithParams();

        fireEvent.click(screen.getByText('Simulate Loss'));

        expect(screen.getByText(/You lose/i)).toBeInTheDocument();
        expect(screen.getByText(/Better luck next time/i)).toBeInTheDocument();
    });

    test('exit button navigates back', () => {
        renderWithParams();

        const exitBtn = screen.getByRole('button', { name: /exit game/i });
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
});
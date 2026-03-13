import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { GameScreen } from '../GameScreen';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

/**
 * MOCKS DE COMPONENTES
 * Es vital que la ruta sea EXACTAMENTE la misma que usas en GameScreen.tsx
 */

// Mock del GameBoard para evitar cargar la lógica real de hexágonos y sockets
vi.mock('./game/GameBoard', () => ({
    default: ({ onGameOver }: any) => (
        <div data-testid="mock-gameboard">
            <button onClick={() => onGameOver('p1')}>Simulate Win</button>
            <button onClick={() => onGameOver('p2')}>Simulate Loss</button>
        </div>
    )
}));

// Mock del SidePanel usando forwardRef para que no falle la compilación
vi.mock('./game/SidePanel', () => ({
    default: React.forwardRef((_props, _ref) => (
        <div data-testid="mock-sidepanel">Side Panel Mock</div>
    ))
}));

// Mock de la navegación
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate
    };
});

describe('GameScreen Component', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    /**
     * Helper para renderizar con parámetros de URL
     */
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

        // Si estos fallan, es que los mocks no se están aplicando correctamente
        expect(screen.getByTestId('mock-gameboard')).toBeInTheDocument();
        expect(screen.getByTestId('mock-sidepanel')).toBeInTheDocument();
        expect(screen.getByText('Game')).toBeInTheDocument();
    });

    test('shows victory message when player 1 wins', async () => {
        renderWithParams();

        // Hacemos click en el botón de nuestro mock
        fireEvent.click(screen.getByText(/Simulate Win/i));

        expect(screen.getByText(/🎉 You win!/i)).toBeInTheDocument();
        expect(screen.getByText(/Congratulations!/i)).toBeInTheDocument();
    });

    test('shows defeat message when player 2 wins', async () => {
        renderWithParams();

        // Hacemos click en el botón de nuestro mock
        fireEvent.click(screen.getByText(/Simulate Loss/i));

        expect(screen.getByText(/😞 You lose!/i)).toBeInTheDocument();
        expect(screen.getByText(/Better luck next time!/i)).toBeInTheDocument();
    });

    test('exit button navigates to the previous page', async () => {
        renderWithParams();

        const exitBtn = screen.getByRole('button', { name: /exit game/i });
        fireEvent.click(exitBtn);

        // Verifica que use navigate(-1) o la ruta que hayas definido
        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

    test('back to menu button works after game over', () => {
        renderWithParams();

        // Simular fin de partida
        fireEvent.click(screen.getByText(/Simulate Win/i));

        const backBtn = screen.getByRole('button', { name: /back to menu/i });
        fireEvent.click(backBtn);

        // Verificamos que redirige
        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });
});
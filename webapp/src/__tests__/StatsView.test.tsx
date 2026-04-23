import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import StatsView from '../StatsView';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';

// Mock de useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

// Mock de Recharts so we can render the charts without errors in the test environment
vi.mock('recharts', async () => {
    const original = await vi.importActual('recharts');
    return {
        ...original,
        ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
    };
});

describe('StatsView Component', () => {
    const mockStats = {
        userId: 'user123',
        gamesPlayed: 20,
        wins: 15,
        losses: 5,
        winRate: 0.75
    };

    const mockRanking = {
        topPlayers: [
            { userId: { _id: 'other1' }, wins: 20 },
            { userId: { _id: 'user123' }, wins: 15 }, // User position is 2nd
            { userId: { _id: 'other2' }, wins: 10 }
        ]
    };

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        localStorage.setItem('userId', 'user123');
        localStorage.setItem('token', 'fake-token');

        // Mock de la API fetch global
        global.fetch = vi.fn();
    });

    test('renders loading state initially', () => {
        (global.fetch as any).mockImplementation(() => new Promise(() => { })); // Never ends so its always loading
        render(<MemoryRouter><StatsView /></MemoryRouter>);

        expect(screen.getByText(/Loading your performance data/i)).toBeInTheDocument();
    });

    test('renders statistics and ranking correctly on success', async () => {
        (global.fetch as any)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => mockStats,
            })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => mockRanking,
            });

        render(<MemoryRouter><StatsView /></MemoryRouter>);

        // Esperar a que los datos se carguen
        await waitFor(() => {
            expect(screen.getByText('20')).toBeInTheDocument(); // Total Matches
            expect(screen.getByText('15')).toBeInTheDocument(); // Victories
            expect(screen.getByText('5')).toBeInTheDocument();  // Defeats
        });

        // Win rate
        expect(screen.getByText('75%')).toBeInTheDocument();

        // Ranking
        expect(screen.getByText('#2')).toBeInTheDocument();
    });

    test('navigates back to menu when clicking back button', async () => {
        const user = userEvent.setup();
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockStats,
        });

        render(<MemoryRouter><StatsView /></MemoryRouter>);

        // Buscamos específicamente el botón que tiene el icono de volver
        // Si no tiene texto, puedes buscarlo por su posición o añadirle un aria-label en el componente
        const buttons = await screen.findAllByRole('button');
        const backBtn = buttons[0]; // Asumiendo que el de volver es el primero (el de arriba a la izquierda)

        await user.click(backBtn);
        expect(mockNavigate).toHaveBeenCalledWith('/menu');
    });

    test('shows "Unranked" if user is not in the top players list', async () => {
        (global.fetch as any)
            .mockResolvedValueOnce({ ok: true, json: async () => mockStats })
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ topPlayers: [{ userId: 'someone-else', wins: 100 }] }),
            });

        render(<MemoryRouter><StatsView /></MemoryRouter>);

        await waitFor(() => {
            expect(screen.getByText('Unranked')).toBeInTheDocument();
        });
    });

    test('navigates to match history when clicking view details button', async () => {
        const user = userEvent.setup();
        //Mock de las respuesta de la API para match history
        (global.fetch as any).mockResolvedValue({
            ok: true,
            json: async () => mockStats,
        });

        render(<MemoryRouter><StatsView /></MemoryRouter>);

        // Buscamos "View Details" 
        const historyBtn = await screen.findByRole('button', { name: /view details/i });

        await user.click(historyBtn);


        expect(mockNavigate).toHaveBeenCalledWith('/match-history');
    });

});
import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import MatchHistoryView from '../MatchHistoryView';

// Mock de framer-motion para evitar problemas con las animaciones en el entorno de test
vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    },
}));

// Datos de ejemplo basados en tu interfaz Match y el JSON de tu captura
const mockMatches = [
    {
        gameId: "match-123456",
        status: "won",
        botId: "beginner_bot",
        boardSize: 11,
        createdAt: "2026-04-14T17:41:09Z"
    },
    {
        gameId: "match-789012",
        status: "lost",
        botId: "medium_bot",
        boardSize: 7,
        createdAt: "2026-04-13T10:00:00Z"
    }
];

describe('MatchHistoryView Component', () => {

    const { mockNavigate } = vi.hoisted(() => {
        return { mockNavigate: vi.fn() };
    });

    beforeEach(() => {
        vi.clearAllMocks();




        vi.mock('react-router-dom', async () => {
            const actual = await vi.importActual('react-router-dom');
            return {
                ...actual,
                useNavigate: () => mockNavigate,
            };
        });

        // Mock de localStorage
        const store: Record<string, string> = { 'token': 'fake-token' };
        Object.defineProperty(window, 'localStorage', {
            value: {
                getItem: vi.fn((key: string) => store[key] || null),
            },
            configurable: true
        });

        // Mock de fetch global
        global.fetch = vi.fn();
    });

    it('debe mostrar el indicador de carga inicialmente', () => {
        render(
            <MemoryRouter>
                <MatchHistoryView />
            </MemoryRouter>
        );
        expect(screen.getByText(/loading/i)).toBeTruthy();
    });

    it('debe renderizar la lista de partidas correctamente cuando la API responde', async () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => mockMatches,
        });

        render(
            <MemoryRouter>
                <MatchHistoryView />
            </MemoryRouter>
        );

        // En lugar de expect(...) directo, usamos waitFor
        await waitFor(() => {
            const winBadge = screen.getByText(/WON/i);
            expect(winBadge).toBeDefined();

            // Verificamos que el loading ya NO esté
            expect(screen.queryByText(/loading/i)).toBeNull();
        });

        // IMPORTANTE: Un pequeño respiro para que React limpie efectos secundarios
        await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    });

    it('debe mostrar el mensaje de "No matches found" si la lista está vacía', async () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ games: [] }), // Probamos el caso con objeto anidado vacío
        });

        render(
            <MemoryRouter>
                <MatchHistoryView />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/no matches found/i)).toBeTruthy();
        });
    });

    it('debe mostrar el botón "Resume" si la partida está en estado "ongoing"', async () => {
        // 1. Preparamos un mock de partida con estado 'ongoing'
        const ongoingMatch = {
            gameId: "match-123456",
            status: 'ongoing',
            botId: "medium_bot",
            boardSize: 7,
            createdAt: new Date().toISOString()
        };

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => [ongoingMatch],
        });

        render(
            <MemoryRouter>
                <MatchHistoryView />
            </MemoryRouter>
        );

        // 2. Verificamos que el botón "Resume" aparece en pantalla
        await waitFor(() => {
            const resumeButton = screen.getByRole('button', { name: /resume/i });
            expect(resumeButton).toBeTruthy();
        });

    });

    it('debe manejar errores de red de la API sin romper el componente', async () => {
        (global.fetch as any).mockRejectedValueOnce(new Error('Network Error'));

        render(
            <MemoryRouter>
                <MatchHistoryView />
            </MemoryRouter>
        );

        await waitFor(() => {
            // Al fallar el fetch, matches se queda vacío []
            expect(screen.getByText(/no matches found/i)).toBeTruthy();
        });
    });
});
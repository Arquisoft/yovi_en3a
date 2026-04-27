import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import RankingView from '../UsersView/RankingView';


vi.mock('framer-motion', () => ({
    motion: {
        div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
        tr: ({ children, ...props }: any) => <tr {...props}>{children}</tr>,
    },
}));

vi.mock('lucide-react', () => ({
    Trophy: () => <span>TrophyIcon</span>,
    Medal: () => <span>MedalIcon</span>,
    ArrowLeft: () => <span>BackIcon</span>,
    User: () => <span>UserIcon</span>,
    Target: () => <span>TargetIcon</span>, // <--- AÑADE ESTA LÍNEA
}));

describe('RankingView Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // 1. Mock funcional de localStorage
        const store: Record<string, string> = {
            'token': 'fake-token',
            'userId': 'my-user-id'
        };

        const localStorageMock = {
            getItem: vi.fn((key: string) => store[key] || null),
            setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
            clear: vi.fn(() => { for (const key in store) delete store[key]; }),
            removeItem: vi.fn((key: string) => { delete store[key]; })
        };

        // Reemplazamos la propiedad global
        Object.defineProperty(window, 'localStorage', {
            value: localStorageMock,
            configurable: true
        });

        // 2. Inicializamos el mock de fetch
        global.fetch = vi.fn();
    });

    it('debe mostrar el estado de carga al inicio', () => {
        render(
            <MemoryRouter>
                <RankingView />
            </MemoryRouter>
        );
        expect(screen.getByText(/loading rankings/i)).toBeTruthy();// ToBeTruthy is used because the text might be wrapped in other elements, so we just want to check if it exists in the document
    });

    it('debe renderizar el podio (Top 3) correctamente', async () => {
        const mockPlayers = [
            { userId: { _id: '1', username: 'Winner' }, wins: 100, gamesPlayed: 150 },
            { userId: { _id: '2', username: 'Second' }, wins: 80, gamesPlayed: 120 },
            { userId: { _id: '3', username: 'Third' }, wins: 60, gamesPlayed: 100 },
        ];

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ topPlayers: mockPlayers }),
        });

        render(
            <MemoryRouter>
                <RankingView />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Winner')).toBeTruthy();
            expect(screen.getByText('Second')).toBeTruthy();
            expect(screen.getByText('Third')).toBeTruthy();
        });
    });

    it('debe renderizar la tabla para jugadores fuera del podio', async () => {
        const mockPlayers = [
            { userId: { _id: '1', username: 'P1' }, wins: 10, gamesPlayed: 20 },
            { userId: { _id: '2', username: 'P2' }, wins: 9, gamesPlayed: 20 },
            { userId: { _id: '3', username: 'P3' }, wins: 8, gamesPlayed: 20 },
            { userId: { _id: '4', username: 'RegularPlayer' }, wins: 5, gamesPlayed: 20 },
        ];

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ topPlayers: mockPlayers }),
        });

        render(
            <MemoryRouter>
                <RankingView />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/#\s*4/)).toBeTruthy();//Regex expresión for find the ranking number 4 without caring about spaces
            expect(screen.getByText('RegularPlayer')).toBeTruthy();
        });
    });

    it('debe manejar una lista de ranking vacía sin romperse', async () => {
        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ topPlayers: [] }),
        });

        render(
            <MemoryRouter>
                <RankingView />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/global leaderboard/i)).toBeTruthy();
        });
    });

    it('debe mostrar la tarjeta de ranking personal si el usuario no está en el Top 20', async () => {
        // Ahora setItem funcionará porque lo definimos en el beforeEach
        localStorage.setItem('userId', 'not-in-top-id');

        const mockPlayers = Array(5).fill(null).map((_, i) => ({
            userId: { _id: `id-${i}`, username: `Player ${i}` },
            wins: 10 - i,
            gamesPlayed: 20
        }));

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                topPlayers: mockPlayers,
                userPosition: { position: 150, wins: 2, gamesPlayed: 40 }
            }),
        });

        render(
            <MemoryRouter>
                <RankingView />
            </MemoryRouter>
        );

        // findByText ya incluye el waitFor internamente
        const standingCard = await screen.findByText(/Your Standing/i);
        expect(standingCard).toBeTruthy();
        expect(screen.getByText(/#150/i)).toBeDefined();
    });

    it('no debe mostrar la tarjeta personal si el usuario ya aparece en el Top 20', async () => {
        const mockPlayers = [
            { userId: { _id: 'user-123', username: 'SoyYo' }, wins: 10, gamesPlayed: 20 }
        ];

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                topPlayers: mockPlayers,
                userPosition: { position: 1, wins: 10, gamesPlayed: 20 }
            }),
        });

        render(
            <MemoryRouter>
                <RankingView />
            </MemoryRouter>
        );

        await waitFor(() => {
            // El título de la tarjeta personal NO debería estar en el documento
            const personalCardTitle = screen.queryByText(/Your Standing/i);
            expect(personalCardTitle).toBeNull();
        });
    });



    it('debe calcular y mostrar el Win Rate correctamente en la tabla', async () => {

        const mockPlayers = [
            { userId: { _id: '1', username: 'P1' }, wins: 10, gamesPlayed: 10 },
            { userId: { _id: '2', username: 'P2' }, wins: 10, gamesPlayed: 10 },
            { userId: { _id: '3', username: 'P3' }, wins: 10, gamesPlayed: 10 },
            {
                userId: { _id: '4', username: 'ProPlayer' },
                wins: 15,
                gamesPlayed: 20 // 75%
            },
        ];

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ topPlayers: mockPlayers }),
        });

        render(
            <MemoryRouter>
                <RankingView />
            </MemoryRouter>
        );

        // Usamos una función de búsqueda más flexible por si el % está en un span distinto
        await waitFor(() => {
            const winRateElement = screen.getByText((content) => content.includes('75.0%'));
            expect(winRateElement).toBeTruthy();
        }, { timeout: 2000 });
    });

    it('debe resaltar al usuario actual en la tabla con la etiqueta "YOU"', async () => {
        const myId = 'test-user-123';

        // Forzamos el valor en nuestro mock de store
        localStorage.setItem('userId', myId);

        const mockPlayers = [
            { userId: { _id: '1', username: 'P1' }, wins: 10, gamesPlayed: 10 },
            { userId: { _id: '2', username: 'P2' }, wins: 10, gamesPlayed: 10 },
            { userId: { _id: '3', username: 'P3' }, wins: 10, gamesPlayed: 10 },
            { userId: { _id: myId, username: 'SoyYo' }, wins: 5, gamesPlayed: 10 }, // Índice 3 -> Tabla
        ];

        (global.fetch as any).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ topPlayers: mockPlayers }),
        });

        render(
            <MemoryRouter>
                <RankingView />
            </MemoryRouter>
        );

        // Buscamos el texto "You" que está dentro del span azul
        await waitFor(() => {
            const youLabel = screen.getByText(/You/i);
            expect(youLabel).toBeTruthy();
        }, { timeout: 2000 });
    });
});
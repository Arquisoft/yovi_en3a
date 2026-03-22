import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import RankingView from '../RankingView';


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
}));

describe('RankingView Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        const localStorageMock = {
            getItem: vi.fn((key) => (key === 'token' ? 'fake-token' : null)),
        };
        Object.defineProperty(window, 'localStorage', { value: localStorageMock });
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
});
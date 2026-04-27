import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GameSelect from '../game/GameSelect'
import { describe, expect, test, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

describe('GameSelect Component', () => {
    const mockOnBack = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
    });

    test('renders bot game variants', () => {
        render(<MemoryRouter><GameSelect onBack={mockOnBack} mode="bot" /></MemoryRouter>)
        expect(screen.getByText(/Master/i)).toBeInTheDocument()
        expect(screen.getByText(/Fortune/i)).toBeInTheDocument()
        expect(screen.queryByText(/Tabu/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/Holey/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/Why Not/i)).not.toBeInTheDocument()
    })

    test('renders all game variants in multiplayer mode', () => {
        render(<MemoryRouter><GameSelect onBack={mockOnBack} mode="multiplayer" /></MemoryRouter>)
        expect(screen.getByText(/Master/i)).toBeInTheDocument()
        expect(screen.getByText(/Fortune/i)).toBeInTheDocument()
        expect(screen.getByText(/Tabu/i)).toBeInTheDocument()
        expect(screen.getByText(/Holey/i)).toBeInTheDocument()
        expect(screen.getByText(/Why Not/i)).toBeInTheDocument()
    })

    test('can configure and start a standard game', async () => {
        const user = userEvent.setup()

        global.fetch = vi.fn().mockResolvedValueOnce({
            ok: true,
            json: async () => ({ gameId: '123' }),
        } as Response)

        render(<MemoryRouter><GameSelect onBack={mockOnBack} /></MemoryRouter>)

        // Abrir panel
        await user.click(screen.getByText(/Standard Mode/i))

        // Cambiar tamaño a 9
        const sizeBtn = screen.getByRole('button', { name: '9' })
        await user.click(sizeBtn)

        // Cambiar dificultad
        const select = screen.getByRole('combobox')
        await user.selectOptions(select, 'medium_bot')

        // Iniciar
        await user.click(screen.getByText(/Start Standard/i))

        await waitFor(() => {
            expect(global.fetch).toHaveBeenCalledWith(
                expect.stringContaining('/api/game-manager/create/standard'),
                expect.objectContaining({
                    method: 'POST',
                    body: JSON.stringify({ botId: 'medium_bot', boardSize: 9 })
                })
            )
            expect(mockNavigate).toHaveBeenCalledWith('/game/123/9/standard', { state: { isMultiplayer: false } })
        })
    })

    //AÑADIR TESTS PARA LOS OTROS MODOS DE JUEGO SEGUN SE VAYAN IMPLEMENTANDO
})
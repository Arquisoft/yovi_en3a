import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import MenuView from '../MenuView'
import { describe, expect, test, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'

// Mock de useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

describe('MenuView Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();

        vi.spyOn(Storage.prototype, 'removeItem');// Espiamos removeItem para verificar que se llame al hacer logout
    });

    test('renders all menu options', () => {
        render(<MemoryRouter><MenuView /></MemoryRouter>)

        expect(screen.getByText(/Play vs Bot/i)).toBeInTheDocument()
        expect(screen.getByText(/Multiplayer/i)).toBeInTheDocument()
        expect(screen.getByText(/History & Stats/i)).toBeInTheDocument()
        expect(screen.getByText(/How to Play/i)).toBeInTheDocument()
    })

    test('navigates to select-game when clicking Play vs Bot', async () => {
        const user = userEvent.setup()
        render(<MemoryRouter><MenuView /></MemoryRouter>)

        const playBtn = screen.getByText(/Play vs Bot/i)
        await user.click(playBtn)

        expect(mockNavigate).toHaveBeenCalledWith('/select-game')
    })

    test('logout clears localStorage and redirects to landing', async () => {
        const user = userEvent.setup()

        // Seteamos datos falsos para ver si se borran
        localStorage.setItem('token', 'fake-token')

        render(<MemoryRouter><MenuView /></MemoryRouter>)

        const logoutBtn = screen.getByRole('button', { name: /log out/i })
        await user.click(logoutBtn)

        // Verificamos que se llamó a remover los items
        expect(localStorage.removeItem).toHaveBeenCalledWith('token')
        expect(localStorage.removeItem).toHaveBeenCalledWith('userId')

        // Verificamos redirección a la raíz
        expect(mockNavigate).toHaveBeenCalledWith('/')
    })

    /*
    test('navigates to other sections correctly', async () => {
      const user = userEvent.setup()
      render(<MemoryRouter><MenuView /></MemoryRouter>)
  
      // Probar Multiplayer
      await user.click(screen.getByText(/Multiplayer/i))
      expect(mockNavigate).toHaveBeenCalledWith('/multiplayer')
  
      // Probar History
      await user.click(screen.getByText(/History & Stats/i))
      expect(mockNavigate).toHaveBeenCalledWith('/history')
    })*/
});
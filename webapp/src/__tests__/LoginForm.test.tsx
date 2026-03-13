import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginForm from '../LoginForm'
import { afterEach, describe, expect, test, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'

// Mock de useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('LoginForm', () => {
    beforeEach(() => {
        vi.clearAllMocks()
        // Limpiamos el localStorage antes de cada test
        localStorage.clear()
        // Mock del localStorage
        vi.spyOn(Storage.prototype, 'setItem')
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    test('shows validation error when fields are empty', async () => {
        render(<MemoryRouter><LoginForm /></MemoryRouter>)
        const user = userEvent.setup()

        await waitFor(async () => {
            await user.click(screen.getByRole('button', { name: /login/i }))
            expect(screen.getByText(/please enter a username/i)).toBeInTheDocument()
        })
    })

    test('shows server error on invalid credentials', async () => {
        const user = userEvent.setup()

        // Simulamos fallo de login
        global.fetch = vi.fn().mockResolvedValueOnce({
            ok: false,
            status: 401,
            json: async () => ({ error: 'Invalid username or password' }),
        } as Response)

        render(<MemoryRouter><LoginForm /></MemoryRouter>)

        await waitFor(async () => {
            await user.type(screen.getByLabelText(/username/i), 'pablo')
            await user.type(screen.getByLabelText(/password/i), 'wrongpass')
            await user.click(screen.getByRole('button', { name: /login/i }))

            expect(screen.getByText(/invalid username or password/i)).toBeInTheDocument()
        })
    })

    test('successful login stores token and navigates to menu', async () => {
        const user = userEvent.setup()
        const mockToken = 'fake-jwt-token'
        const mockUserId = 'user-123'


        global.fetch = vi.fn().mockResolvedValueOnce({
            ok: true,
            json: async () => ({
                message: 'Login successful!',
                token: mockToken,
                userId: mockUserId
            }),
        } as Response)

        render(<MemoryRouter><LoginForm /></MemoryRouter>)

        await waitFor(async () => {
            await user.type(screen.getByLabelText(/username/i), 'pablo')
            await user.type(screen.getByLabelText(/password/i), 'secret123')
            await user.click(screen.getByRole('button', { name: /login/i }))


            expect(screen.getByText(/login successful!/i)).toBeInTheDocument()


            expect(localStorage.setItem).toHaveBeenCalledWith('token', mockToken)
            expect(localStorage.setItem).toHaveBeenCalledWith('userId', mockUserId)
        })

        // Verificamos redirección (setTimeout de 1000ms)
        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/menu')
        }, { timeout: 1500 })
    })

    test('navigates to register when clicking the button', async () => {
        const user = userEvent.setup()
        render(<MemoryRouter><LoginForm /></MemoryRouter>)

        await waitFor(async () => {
            await user.click(screen.getByRole('button', { name: /register here/i }))
            expect(mockNavigate).toHaveBeenCalledWith('/register')
        })
    })
})
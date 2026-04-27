import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Landing from '../Landing'
import { describe, expect, test, vi } from 'vitest'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'

// Mockeamos la función de navegación
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

describe('Landing Page Navigation', () => {
    test('redirects to login and register views', async () => {
        const user = userEvent.setup()
        render(<MemoryRouter><Landing /></MemoryRouter>)


        const loginBtn = screen.getByRole('button', { name: /log in/i })
        await user.click(loginBtn)
        expect(mockNavigate).toHaveBeenCalledWith('/login')


        const signUpBtn = screen.getByRole('button', { name: /sign up/i })
        await user.click(signUpBtn)
        expect(mockNavigate).toHaveBeenCalledWith('/register')
    })
})
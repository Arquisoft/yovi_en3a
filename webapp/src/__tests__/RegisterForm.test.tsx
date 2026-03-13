import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RegisterForm from '../RegisterForm'
import { afterEach, describe, expect, test, vi } from 'vitest'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('RegisterForm', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    vi.clearAllMocks()
  })

  // Your existing tests...
  test('shows validation error when username is empty', async () => {
    render(<MemoryRouter><RegisterForm /></MemoryRouter>)
    const user = userEvent.setup()

    await waitFor(async () => {
      await user.click(screen.getByRole('button', { name: /register/i }))
      expect(screen.getByText(/please enter a username/i)).toBeInTheDocument()
    })
  })

  // New Test: Password Mismatch
  test('shows error when passwords do not match', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><RegisterForm /></MemoryRouter>)

    await waitFor(async () => {
      await user.type(screen.getByLabelText(/username/i), 'Pablo')
      await user.type(screen.getByLabelText(/email/i), 'pablo@test.com')
      await user.type(screen.getByLabelText(/^password$/i), 'secret123')
      await user.type(screen.getByLabelText(/confirm password/i), 'different123')
      await user.click(screen.getByRole('button', { name: /register/i }))

      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })
  })

  // New Test: Server Error (e.g., User already exists)
  test('displays server error message on failure', async () => {
    const user = userEvent.setup()

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Email already in use' }),
    } as Response)

    render(<MemoryRouter><RegisterForm /></MemoryRouter>)

    await waitFor(async () => {
      await user.type(screen.getByLabelText(/username/i), 'Pablo')
      await user.type(screen.getByLabelText(/email/i), 'pablo@test.com')
      await user.type(screen.getByLabelText(/^password$/i), 'secret123')
      await user.type(screen.getByLabelText(/confirm password/i), 'secret123')
      await user.click(screen.getByRole('button', { name: /register/i }))

      expect(screen.getByText(/email already in use/i)).toBeInTheDocument()
    })
  })

  // New Test: Success and Redirection
  test('submits successfully and navigates to login after delay', async () => {
    const user = userEvent.setup()

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Registration successful!' }),
    } as Response)

    render(<MemoryRouter><RegisterForm /></MemoryRouter>)

    // First wait for the success message
    await waitFor(async () => {
      await user.type(screen.getByLabelText(/username/i), 'Pablo')
      await user.type(screen.getByLabelText(/email/i), 'pablo@test.com')
      await user.type(screen.getByLabelText(/^password$/i), 'secret123')
      await user.type(screen.getByLabelText(/confirm password/i), 'secret123')
      await user.click(screen.getByRole('button', { name: /register/i }))

      expect(screen.getByText(/registration successful!/i)).toBeInTheDocument()
    })

    // Then wait for the navigate to be called (setTimeout 1500ms)
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    }, { timeout: 2000 })
  })
})
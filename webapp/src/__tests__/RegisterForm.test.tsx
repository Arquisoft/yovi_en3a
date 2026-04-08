import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RegisterForm from '../RegisterForm'
import { afterEach, describe, expect, test, vi } from 'vitest'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'

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

  test('shows validation error when username is empty', async () => {
    render(<MemoryRouter><RegisterForm /></MemoryRouter>)
    const user = userEvent.setup()

    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByText(/please enter a username/i)).toBeInTheDocument()
    })
  })

  test('shows error when passwords do not match', async () => {
    const user = userEvent.setup()
    render(<MemoryRouter><RegisterForm /></MemoryRouter>)

    await user.type(screen.getByLabelText(/username/i), 'Pablo')
    await user.type(screen.getByLabelText(/email/i), 'pablo@test.com')
    await user.type(screen.getByLabelText(/^password$/i), 'secret123')
    await user.type(screen.getByLabelText(/confirm password/i), 'different123')
    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByText(/passwords do not match/i)).toBeInTheDocument()
    })
  })

  test('displays server error message on failure', async () => {
    const user = userEvent.setup()

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: 'Email already in use' }),
    } as Response)

    render(<MemoryRouter><RegisterForm /></MemoryRouter>)

    await user.type(screen.getByLabelText(/username/i), 'Pablo')
    await user.type(screen.getByLabelText(/email/i), 'pablo@test.com')
    await user.type(screen.getByLabelText(/^password$/i), 'secret123')
    await user.type(screen.getByLabelText(/confirm password/i), 'secret123')
    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByText(/email already in use/i)).toBeInTheDocument()
    })
  })

  test('submits successfully and navigates to login after delay', async () => {
    const user = userEvent.setup()

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Registration successful!' }),
    } as Response)

    render(<MemoryRouter><RegisterForm /></MemoryRouter>)

    await user.type(screen.getByLabelText(/username/i), 'Pablo')
    await user.type(screen.getByLabelText(/email/i), 'pablo@test.com')
    await user.type(screen.getByLabelText(/^password$/i), 'secret123')
    await user.type(screen.getByLabelText(/confirm password/i), 'secret123')
    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByText(/registration successful!/i)).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login')
    }, { timeout: 2000 })
  })

  test('renders the country dropdown', () => {
    render(<MemoryRouter><RegisterForm /></MemoryRouter>)

    const countrySelect = document.querySelector('select[name="rcrs-country"]')
    expect(countrySelect).toBeInTheDocument()
  })

  test('submits with selected country in the payload', async () => {
    const user = userEvent.setup()

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Registration successful!' }),
    } as Response)

    render(<MemoryRouter><RegisterForm /></MemoryRouter>)

    await user.type(screen.getByLabelText(/username/i), 'Pablo')
    await user.type(screen.getByLabelText(/email/i), 'pablo@test.com')
    await user.type(screen.getByLabelText(/^password$/i), 'secret123')
    await user.type(screen.getByLabelText(/confirm password/i), 'secret123')

    const countrySelect = document.querySelector('select[name="rcrs-country"]')!
    await user.selectOptions(countrySelect as HTMLElement, 'Spain')

    await user.click(screen.getByRole('button', { name: /register/i }))

    await waitFor(() => {
      expect(screen.getByText(/registration successful!/i)).toBeInTheDocument()
    })

    const fetchCall = vi.mocked(global.fetch).mock.calls[0]
    const body = JSON.parse(fetchCall[1]?.body as string)
    expect(body.country).toBe('Spain')
  })
})
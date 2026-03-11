import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RegisterForm from '../RegisterForm'
import { afterEach, describe, expect, test, vi } from 'vitest'
import '@testing-library/jest-dom'

describe('RegisterForm', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('shows validation error when username is empty', async () => {
    render(<RegisterForm onSwitchToLogin={() => {}} />)
    const user = userEvent.setup()

    await waitFor(async () => {
      await user.click(screen.getByRole('button', { name: /register/i })) // ✅ was "lets go!"
      expect(screen.getByText(/please enter a username/i)).toBeInTheDocument()
    })
  })

  test('submits username and displays response', async () => {
    const user = userEvent.setup()

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Hello Pablo! Welcome to the course!' }),
    } as Response)

    render(<RegisterForm onSwitchToLogin={() => {}} />)

    await waitFor(async () => {
      await user.type(screen.getByLabelText(/username/i), 'Pablo')        // ✅ was "whats your name?"
      await user.type(screen.getByLabelText(/email/i), 'pablo@test.com')  // ✅ added — now required
      await user.type(screen.getByLabelText(/^password$/i), 'secret123')  // ✅ added — now required
      await user.type(screen.getByLabelText(/confirm password/i), 'secret123') // ✅ added — must match
      await user.click(screen.getByRole('button', { name: /register/i })) // ✅ was "lets go!"

      expect(
        screen.getByText(/hello pablo! welcome to the course!/i)
      ).toBeInTheDocument()
    })
  })
})
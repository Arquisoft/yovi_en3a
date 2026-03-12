import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RegisterForm from '../RegisterForm'
import { afterEach, describe, expect, test, vi } from 'vitest'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'

describe('RegisterForm', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('shows validation error when username is empty', async () => {
    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>
    )
    const user = userEvent.setup()

    await waitFor(async () => {
      await user.click(screen.getByRole('button', { name: /register/i }))
      expect(screen.getByText(/please enter a username/i)).toBeInTheDocument()
    })
  })

  test('submits username and displays response', async () => {
    const user = userEvent.setup()

    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Hello Pablo! Welcome to the course!' }),
    } as Response)

    render(
      <MemoryRouter>
        <RegisterForm />
      </MemoryRouter>
    )

    await waitFor(async () => {
      await user.type(screen.getByLabelText(/username/i), 'Pablo')
      await user.type(screen.getByLabelText(/email/i), 'pablo@test.com')
      await user.type(screen.getByLabelText(/^password$/i), 'secret123')
      await user.type(screen.getByLabelText(/confirm password/i), 'secret123')
      await user.click(screen.getByRole('button', { name: /register/i }))

      expect(
        screen.getByText(/hello pablo! welcome to the course!/i)
      ).toBeInTheDocument()
    })
  })
})
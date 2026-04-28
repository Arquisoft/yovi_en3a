import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GameSelect from '../game/GameSelect'
import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest'
import '@testing-library/jest-dom'
import { MemoryRouter } from 'react-router-dom'

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

// Mock useTickSound hook
vi.mock('../hooks/useTickSound', () => ({
    default: () => vi.fn()
}));

describe('GameSelect Component', () => {
    const mockOnBack = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        global.fetch = vi.fn();
        // Mock localStorage
        Storage.prototype.getItem = vi.fn(() => 'mock-token');
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('Rendering variants by mode', () => {
        test('renders only bot-compatible variants in bot mode', () => {
            render(<MemoryRouter><GameSelect onBack={mockOnBack} mode="bot" /></MemoryRouter>)
            
            // Should render bot variants
            expect(screen.getByText('Master')).toBeInTheDocument()
            expect(screen.getByText('Fortune')).toBeInTheDocument()
            
            // Should NOT render multiplayer-only variants
            expect(screen.queryByText('Pie Rule')).not.toBeInTheDocument()
            expect(screen.queryByText('Tabu')).not.toBeInTheDocument()
            expect(screen.queryByText('Holey')).not.toBeInTheDocument()
            expect(screen.queryByText('Why Not')).not.toBeInTheDocument()
        })

        test('renders all game variants in multiplayer mode', () => {
            render(<MemoryRouter><GameSelect onBack={mockOnBack} mode="multiplayer" /></MemoryRouter>)
            
            // Should render all variants
            expect(screen.getByText('Master')).toBeInTheDocument()
            expect(screen.getByText('Fortune')).toBeInTheDocument()
            expect(screen.getByText('Pie Rule')).toBeInTheDocument()
            expect(screen.getByText('Tabu')).toBeInTheDocument()
            expect(screen.getByText('Holey')).toBeInTheDocument()
            expect(screen.getByText('Why Not')).toBeInTheDocument()
        })
    })

    describe('Standard game configuration', () => {
        test('can configure and start a standard game in bot mode', async () => {
            const user = userEvent.setup()

            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: true,
                json: async () => ({ gameId: 'std-123' }),
            } as Response)

            render(<MemoryRouter><GameSelect onBack={mockOnBack} mode="bot" /></MemoryRouter>)

            // Open standard panel
            await user.click(screen.getByText(/Standard Mode/i))

            // Change size to 9
            const sizeBtn = screen.getByRole('button', { name: '9' })
            await user.click(sizeBtn)

            // Change difficulty
            const select = screen.getByRole('combobox')
            await user.selectOptions(select, 'medium_bot')

            // Start game
            await user.click(screen.getByText(/Start Standard/i))

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    expect.stringContaining('/api/game-manager/create/standard'),
                    expect.objectContaining({
                        method: 'POST',
                        headers: expect.objectContaining({
                            'Content-Type': 'application/json',
                            Authorization: 'Bearer mock-token',
                        }),
                        body: JSON.stringify({ botId: 'medium_bot', boardSize: 9 })
                    })
                )
                expect(mockNavigate).toHaveBeenCalledWith(
                    '/game/std-123/9/standard', 
                    { state: { isMultiplayer: false } }
                )
            })
        })

        test('shows difficulty selector only in bot mode', async () => {
            const user = userEvent.setup()
            const { rerender } = render(
                <MemoryRouter><GameSelect onBack={mockOnBack} mode="bot" /></MemoryRouter>
            )

            await user.click(screen.getByText(/Standard Mode/i))
            expect(screen.getByRole('combobox')).toBeInTheDocument()

            rerender(<MemoryRouter><GameSelect onBack={mockOnBack} mode="multiplayer" /></MemoryRouter>)
            await user.click(screen.getByText(/Standard Mode/i))
            expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
        })
    })

    describe('Master variant', () => {
        test('can configure and start master game in bot mode', async () => {
            const user = userEvent.setup()

            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: true,
                json: async () => ({ gameId: 'master-789' }),
            } as Response)

            render(<MemoryRouter><GameSelect onBack={mockOnBack} mode="bot" /></MemoryRouter>)

            // Click Master variant card (not the button)
            const masterCard = screen.getByText('Each player places two pieces per turn').closest('button')
            await user.click(masterCard!)

            // Change size
            const sizeBtn = screen.getByRole('button', { name: '5' })
            await user.click(sizeBtn)

            // Start
            await user.click(screen.getByText(/Start Master/i))

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    expect.stringContaining('/api/game-manager/create/master'),
                    expect.objectContaining({
                        body: JSON.stringify({ botId: 'medium_bot', boardSize: 5 })
                    })
                )
            })
        })
    })

    describe('Fortune variant', () => {
        test('can configure and start fortune game in bot mode', async () => {
            const user = userEvent.setup()

            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: true,
                json: async () => ({ gameId: 'fortune-202' }),
            } as Response)

            render(<MemoryRouter><GameSelect onBack={mockOnBack} mode="bot" /></MemoryRouter>)

            const fortuneCard = screen.getByText('A dice decides who plays next').closest('button')
            await user.click(fortuneCard!)
            await user.click(screen.getByText(/Start Fortune/i))

            await waitFor(() => {
                expect(global.fetch).toHaveBeenCalledWith(
                    expect.stringContaining('/api/game-manager/create/fortune'),
                    expect.objectContaining({
                        body: JSON.stringify({ botId: 'medium_bot', boardSize: 7 })
                    })
                )
            })
        })
    })

    describe('Error handling', () => {
        test('handles fetch error gracefully', async () => {
            const user = userEvent.setup()
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

            global.fetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))

            render(<MemoryRouter><GameSelect onBack={mockOnBack} mode="bot" /></MemoryRouter>)

            await user.click(screen.getByText(/Standard Mode/i))
            await user.click(screen.getByText(/Start Standard/i))

            await waitFor(() => {
                expect(consoleErrorSpy).toHaveBeenCalledWith(
                    'Error creating game:',
                    expect.any(Error)
                )
                expect(mockNavigate).not.toHaveBeenCalled()
            })

            consoleErrorSpy.mockRestore()
        })

        test('handles server error response', async () => {
            const user = userEvent.setup()
            const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

            global.fetch = vi.fn().mockResolvedValueOnce({
                ok: false,
                json: async () => ({ error: 'Invalid game type' }),
            } as Response)

            render(<MemoryRouter><GameSelect onBack={mockOnBack} mode="bot" /></MemoryRouter>)

            await user.click(screen.getByText(/Standard Mode/i))
            await user.click(screen.getByText(/Start Standard/i))

            await waitFor(() => {
                expect(consoleErrorSpy).toHaveBeenCalled()
                expect(mockNavigate).not.toHaveBeenCalled()
            })

            consoleErrorSpy.mockRestore()
        })
    })

    describe('UI interactions', () => {
        test('back button calls onBack and navigates to menu', async () => {
            const user = userEvent.setup()

            render(<MemoryRouter><GameSelect onBack={mockOnBack} mode="bot" /></MemoryRouter>)

            await user.click(screen.getByText(/← Back/i))

            expect(mockOnBack).toHaveBeenCalled()
            expect(mockNavigate).toHaveBeenCalledWith('/menu')
        })

        test('can toggle standard panel open and close', async () => {
            const user = userEvent.setup()

            render(<MemoryRouter><GameSelect onBack={mockOnBack} mode="bot" /></MemoryRouter>)

            // Initially closed
            expect(screen.queryByText(/Board Size:/i)).not.toBeInTheDocument()

            // Open
            await user.click(screen.getByText(/Standard Mode/i))
            expect(screen.getByText(/Board Size:/i)).toBeInTheDocument()

            // Close
            await user.click(screen.getByText(/Standard Mode/i))
            expect(screen.queryByText(/Board Size:/i)).not.toBeInTheDocument()
        })

        test('can toggle variant panel open and close', async () => {
            const user = userEvent.setup()

            render(<MemoryRouter><GameSelect onBack={mockOnBack} mode="bot" /></MemoryRouter>)

            // Open Master using description to find unique card
            const masterCard = screen.getByText('Each player places two pieces per turn').closest('button')
            await user.click(masterCard!)
            expect(screen.getByText(/Start Master/i)).toBeInTheDocument()

            // Close Master
            await user.click(masterCard!)
            expect(screen.queryByText(/Start Master/i)).not.toBeInTheDocument()
        })

        test('shows loading state when creating game', async () => {
            const user = userEvent.setup()

            global.fetch = vi.fn().mockImplementation(() => 
                new Promise(resolve => setTimeout(() => resolve({
                    ok: true,
                    json: async () => ({ gameId: 'test-123' }),
                } as Response), 100))
            )

            render(<MemoryRouter><GameSelect onBack={mockOnBack} mode="bot" /></MemoryRouter>)

            await user.click(screen.getByText(/Standard Mode/i))
            await user.click(screen.getByText(/Start Standard/i))

            // Should show loading text
            expect(screen.getByText(/Creating.../i)).toBeInTheDocument()

            await waitFor(() => {
                expect(mockNavigate).toHaveBeenCalled()
            })
        })
    })

    describe('Size selection', () => {
        test('can select all available board sizes', async () => {
            const user = userEvent.setup()

            render(<MemoryRouter><GameSelect onBack={mockOnBack} mode="bot" /></MemoryRouter>)

            await user.click(screen.getByText(/Standard Mode/i))

            // Test all sizes
            for (const size of [5, 7, 9, 11]) {
                const btn = screen.getByRole('button', { name: String(size) })
                await user.click(btn)
                expect(btn).toHaveClass('is-selected')
            }
        })
    })

    describe('Difficulty selection', () => {
        test('can select all difficulty levels in bot mode', async () => {
            const user = userEvent.setup()

            render(<MemoryRouter><GameSelect onBack={mockOnBack} mode="bot" /></MemoryRouter>)

            await user.click(screen.getByText(/Standard Mode/i))

            const select = screen.getByRole('combobox')
            
            await user.selectOptions(select, 'random_bot')
            expect(select).toHaveValue('random_bot')

            await user.selectOptions(select, 'beginner_bot')
            expect(select).toHaveValue('beginner_bot')

            await user.selectOptions(select, 'medium_bot')
            expect(select).toHaveValue('medium_bot')
        })
    })
})
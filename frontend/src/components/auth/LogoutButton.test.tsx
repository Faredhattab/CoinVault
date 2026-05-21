import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test/utils'
import { LogoutButton } from './LogoutButton'
import * as useAuthModule from '@/hooks/useAuth'

// Mock the useAuth hook
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  useParams: () => ({
    locale: 'en',
  }),
}))

describe('LogoutButton', () => {
  const mockLogout = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useAuthModule.useAuth).mockReturnValue({
      user: { id: '1', email: 'test@example.com', role: 'admin', linked_providers: [], created_at: '', updated_at: '' },
      session: null,
      loading: false,
      login: vi.fn(),
      logout: mockLogout,
      revokeSession: vi.fn(),
    })
  })

  it('renders logout button', () => {
    renderWithIntl(<LogoutButton />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('calls logout when clicked', async () => {
    renderWithIntl(<LogoutButton />)
    const button = screen.getByRole('button')

    fireEvent.click(button)

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalledTimes(1)
    })
  })

  it('button is disabled during logout', async () => {
    mockLogout.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)))

    renderWithIntl(<LogoutButton />)
    const button = screen.getByRole('button')

    fireEvent.click(button)

    expect(button).toBeDisabled()
  })
})

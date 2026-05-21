import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithIntl } from '@/test/utils'
import SessionList from './SessionList'
import * as authService from '@/services/auth-service'

// Mock auth service
vi.mock('@/services/auth-service', () => ({
  authService: {
    getSessions: vi.fn(),
    revokeSession: vi.fn(),
  },
}))

describe('SessionList', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  const messages = {
    sessions: {
      title: 'Active Sessions',
      loading: 'Loading...',
      noSessions: 'No active sessions',
      error: 'Failed to load sessions',
      retry: 'Retry',
      currentSession: 'Current Session',
      lastActive: 'Last Active',
      endSession: 'End Session',
      confirmEnd: 'Are you sure?',
    },
  }

  it('shows loading state initially', () => {
    vi.mocked(authService.authService.getSessions).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    const { container } = renderWithIntl(<SessionList />, { messages })
    // Check for the loading spinner by its class
    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })

  it('displays sessions when loaded', async () => {
    const mockSessions = {
      sessions: [
        {
          id: '1',
          device_info: { browser: 'Chrome', os: 'Windows', device_type: 'desktop' },
          ip_address: '127.0.0.1',
          last_activity: new Date().toISOString(),
          expires_at: new Date().toISOString(),
          is_current: true,
        },
      ],
    }

    vi.mocked(authService.authService.getSessions).mockResolvedValue(mockSessions)

    renderWithIntl(<SessionList />, { messages })

    await waitFor(() => {
      expect(screen.getByTestId('session-list')).toBeInTheDocument()
    })
  })

  it('shows empty state when no sessions', async () => {
    vi.mocked(authService.authService.getSessions).mockResolvedValue({ sessions: [] })

    renderWithIntl(<SessionList />, { messages })

    await waitFor(() => {
      expect(screen.getByText('No active sessions')).toBeInTheDocument()
    })
  })

  it('shows error state when fetch fails', async () => {
    vi.mocked(authService.authService.getSessions).mockRejectedValue(new Error('Failed'))

    renderWithIntl(<SessionList />, { messages })

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })
  })
})

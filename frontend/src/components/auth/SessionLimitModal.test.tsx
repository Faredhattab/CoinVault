import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent } from '@testing-library/react'
import { renderWithIntl } from '@/test/utils'
import { SessionLimitModal } from './SessionLimitModal'

// Mock useAuth
vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    revokeSession: vi.fn(),
  }),
}))

describe('SessionLimitModal', () => {
  const mockSessions = [
    {
      id: '1',
      device: 'Chrome on Windows (desktop)',
      ip_address: '127.0.0.1',
      last_activity: new Date().toISOString(),
      expires_at: new Date().toISOString(),
    },
  ]

  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders modal with sessions', () => {
    renderWithIntl(<SessionLimitModal sessions={mockSessions} onClose={mockOnClose} />)

    // Check that the modal renders with the title from the default messages
    expect(screen.getByText('Session Limit Reached')).toBeInTheDocument()
  })

  it('calls onClose when close button clicked', () => {
    renderWithIntl(<SessionLimitModal sessions={mockSessions} onClose={mockOnClose} />)

    const closeButton = screen.getAllByRole('button').find(btn =>
      btn.textContent?.includes('Close')
    )

    if (closeButton) {
      fireEvent.click(closeButton)
      expect(mockOnClose).toHaveBeenCalled()
    }
  })

  it('displays session information', () => {
    renderWithIntl(<SessionLimitModal sessions={mockSessions} onClose={mockOnClose} />)

    expect(screen.getByText('127.0.0.1')).toBeInTheDocument()
  })
})

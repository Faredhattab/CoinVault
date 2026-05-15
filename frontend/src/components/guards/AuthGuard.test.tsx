import { render, screen } from '@testing-library/react'
import { expect, test, vi, describe } from 'vitest'
import { AuthGuard } from './AuthGuard'
import { useAuth } from '@/hooks/useAuth'
import { useRouter, usePathname } from 'next/navigation'

// Mocks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
  usePathname: vi.fn(),
}))

describe('AuthGuard', () => {
  const mockPush = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as any).mockReturnValue({ push: mockPush })
    ;(usePathname as any).mockReturnValue('/en/admin')
  })

  test('shows loading spinner when loading', () => {
    ;(useAuth as any).mockReturnValue({ user: null, loading: true })
    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    )
    expect(screen.getByRole('status', { hidden: true })).toBeDefined()
    expect(screen.queryByText('Protected Content')).toBeNull()
  })

  test('redirects to login if not authenticated', () => {
    ;(useAuth as any).mockReturnValue({ user: null, loading: false })
    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    )
    expect(mockPush).toHaveBeenCalledWith('/en/login')
  })

  test('renders children if authenticated', () => {
    ;(useAuth as any).mockReturnValue({ user: { id: '123' }, loading: false })
    render(
      <AuthGuard>
        <div>Protected Content</div>
      </AuthGuard>
    )
    expect(screen.getByText('Protected Content')).toBeDefined()
  })
})

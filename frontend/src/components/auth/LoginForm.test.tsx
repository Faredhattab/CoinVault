import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { expect, test, vi, describe } from 'vitest'
import { LoginForm } from './LoginForm'
import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

// Mocks
vi.mock('@/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

vi.mock('next-intl', () => ({
  useTranslations: vi.fn(),
}))

describe('LoginForm', () => {
  const mockLogin = vi.fn()
  const mockPush = vi.fn()
  const mockT = vi.fn((key) => key)

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useAuth as any).mockReturnValue({ login: mockLogin })
    ;(useRouter as any).mockReturnValue({ push: mockPush })
    ;(useTranslations as any).mockReturnValue(mockT)
  })

  test('renders login form', () => {
    render(<LoginForm />)
    expect(screen.getByText('loginTitle')).toBeDefined()
    expect(screen.getByLabelText('emailLabel')).toBeDefined()
    expect(screen.getByLabelText('passwordLabel')).toBeDefined()
  })

  test('shows validation errors for empty fields', async () => {
    render(<LoginForm />)
    fireEvent.click(screen.getByText('loginButton'))

    await waitFor(() => {
      expect(screen.getByText('Invalid email address')).toBeDefined()
      expect(screen.getByText('Password must be at least 12 characters')).toBeDefined()
    })
  })

  test('calls login and redirects on success', async () => {
    mockLogin.mockResolvedValueOnce({})
    render(<LoginForm />)

    fireEvent.change(screen.getByLabelText('emailLabel'), {
      target: { value: 'admin@example.com' },
    })
    fireEvent.change(screen.getByLabelText('passwordLabel'), {
      target: { value: 'SecurePassword123!' },
    })
    fireEvent.click(screen.getByText('loginButton'))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('admin@example.com', 'SecurePassword123!')
      expect(mockPush).toHaveBeenCalledWith('/admin')
    })
  })

  test('shows error message on failure', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Invalid credentials'))
    render(<LoginForm />)

    fireEvent.change(screen.getByLabelText('emailLabel'), {
      target: { value: 'admin@example.com' },
    })
    fireEvent.change(screen.getByLabelText('passwordLabel'), {
      target: { value: 'SecurePassword123!' },
    })
    fireEvent.click(screen.getByText('loginButton'))

    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeDefined()
    })
  })
})

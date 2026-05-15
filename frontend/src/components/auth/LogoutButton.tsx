'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'

export function LogoutButton() {
  const { logout } = useAuth()
  const router = useRouter()
  const t = useTranslations('auth')

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
    }
  }

  return (
    <button
      onClick={handleLogout}
      className="text-sm font-medium text-gray-700 hover:text-red-600 transition-colors"
    >
      {t('logoutButton')}
    </button>
  )
}

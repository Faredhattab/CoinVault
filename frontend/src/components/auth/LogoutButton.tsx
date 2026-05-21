'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { LogOut, Loader2 } from 'lucide-react'
import { useState } from 'react'

export function LogoutButton() {
  const { logout } = useAuth()
  const router = useRouter()
  const t = useTranslations('auth')
  const [isLoggingOut, setIsLoggingOut] = useState(false)

  const handleLogout = async () => {
    if (isLoggingOut) return
    
    setIsLoggingOut(true)
    try {
      await logout()
      router.push('/login')
    } catch (error) {
      console.error('Logout failed:', error)
      setIsLoggingOut(false)
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={isLoggingOut}
      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-red-600 bg-red-50 border border-red-200 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label={t('logoutButton')}
    >
      {isLoggingOut ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <LogOut className="w-4 h-4" />
      )}
      <span>{t('logoutButton')}</span>
    </button>
  )
}

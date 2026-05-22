'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'

export function GoogleLoginButton() {
  const t = useTranslations('auth')
  const [loading, setLoading] = useState(false)

  const handleGoogleLogin = async () => {
    setLoading(true)
    try {
      // Call backend OAuth initiation endpoint
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/v1/auth/oauth/google`)

      if (!response.ok) {
        throw new Error('Failed to initiate OAuth flow')
      }

      const data = await response.json()

      // Redirect to Google OAuth URL
      if (data.oauth_url) {
        window.location.href = data.oauth_url
      }
    } catch (error) {
      console.error('Google login error:', error)
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      disabled={loading}
      className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white border-2 border-[#d8dccf] rounded-md text-[#20221f] font-medium hover:bg-[#f7f7f2] hover:border-[#20221f] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {loading ? (
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-[#20221f]/30 border-t-[#20221f]" />
      ) : (
        <>
          <img src="/icons/google.svg" alt="Google" width={20} height={20} />
          <span>{t('googleLoginButton')}</span>
        </>
      )}
    </button>
  )
}

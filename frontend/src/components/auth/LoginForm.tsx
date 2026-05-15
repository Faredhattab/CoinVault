'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { SessionLimitModal } from './SessionLimitModal'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(12, 'Password must be at least 12 characters'),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const t = useTranslations('auth')
  const { login, revokeSession } = useAuth()
  const router = useRouter()
  const params = useParams()
  const locale = params?.locale as string || 'en'
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [limitExceeded, setLimitExceeded] = useState<{
    sessions: any[]
    message: string
  } | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  })

  const onSubmit = async (data: LoginValues) => {
    setLoading(true)
    setError(null)
    setLimitExceeded(null)
    try {
      await login(data.email, data.password)
      router.push(`/${locale}/admin`)
    } catch (e: any) {
      // Check for structured error from backend
      if (e.message.includes('session_limit_exceeded')) {
        try {
          const errorData = JSON.parse(e.message)
          setLimitExceeded({
            sessions: errorData.active_sessions,
            message: errorData.message
          })
          return
        } catch (parseError) {
          // If not parsable, just show the message
        }
      }
      setError(e.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  const handleRevoke = async (sessionId: string) => {
    try {
      await revokeSession(sessionId)
      setLimitExceeded(null)
      // We can't easily re-submit the form with values here automatically 
      // without storing them, but we can at least tell the user to try again
      setError(null)
    } catch (e: any) {
      setError(e.message || 'Failed to revoke session')
    }
  }

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 w-full max-w-md p-6 bg-white rounded shadow-md">
        <h2 className="text-2xl font-bold text-center">{t('loginTitle')}</h2>
        
        {error && (
          <div className="p-3 bg-red-100 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">{t('emailLabel')}</label>
          <input
            {...register('email')}
            id="email"
            type="email"
            className="mt-1 block w-full border rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">{t('passwordLabel')}</label>
          <input
            {...register('password')}
            id="password"
            type="password"
            className="mt-1 block w-full border rounded-md p-2 shadow-sm focus:ring-blue-500 focus:border-blue-500"
          />
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 disabled:bg-blue-300"
        >
          {loading ? t('loggingIn') : t('loginButton')}
        </button>
      </form>

      {limitExceeded && (
        <SessionLimitModal
          sessions={limitExceeded.sessions}
          onRevoke={handleRevoke}
          onClose={() => setLimitExceeded(null)}
        />
      )}
    </>
  )
}

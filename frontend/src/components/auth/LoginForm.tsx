'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { SessionLimitModal } from './SessionLimitModal'
import { ShieldCheck, Mail, Lock, LogIn } from 'lucide-react'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(12, 'Password must be at least 12 characters'),
})

type LoginValues = z.infer<typeof loginSchema>

export function LoginForm() {
  const t = useTranslations('auth')
  const { login } = useAuth()
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
      if (e.data && e.data.error === 'session_limit_exceeded') {
        setLimitExceeded({
          sessions: e.data.active_sessions,
          message: e.data.message
        })
        return
      }
      setError(e.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="bg-[#20221f] text-white p-3 rounded-xl inline-flex mb-4">
          <ShieldCheck className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold text-[#20221f] mb-2">{t('loginTitle')}</h1>
        <p className="text-[#5d6558]">Secure access to CoinVault administration</p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5 p-8 bg-white rounded-xl border border-[#d8dccf]"
      >
        {error && (
          <div className="p-4 bg-[#ffd9d6] border border-[#7b1d17] text-[#7b1d17] rounded-md text-sm font-bold flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2">
          <label 
            htmlFor="email" 
            className="block text-sm font-bold text-[#20221f] uppercase tracking-wider ml-1"
          >
            {t('emailLabel')}
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5d6558] group-focus-within:text-[#20221f] transition-colors">
              <Mail className="w-5 h-5" />
            </div>
            <input
              {...register('email')}
              id="email"
              type="email"
              className="block w-full pl-10 pr-4 py-3 bg-[#f7f7f2] border border-[#d8dccf] rounded-md text-[#20221f] focus:ring-2 focus:ring-[#20221f] focus:border-transparent transition-all outline-none"
              placeholder="admin@example.com"
            />
          </div>
          {errors.email && <p className="text-[#7b1d17] text-xs font-bold mt-1 ml-1">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <label 
            htmlFor="password" 
            className="block text-sm font-bold text-[#20221f] uppercase tracking-wider ml-1"
          >
            {t('passwordLabel')}
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5d6558] group-focus-within:text-[#20221f] transition-colors">
              <Lock className="w-5 h-5" />
            </div>
            <input
              {...register('password')}
              id="password"
              type="password"
              className="block w-full pl-10 pr-4 py-3 bg-[#f7f7f2] border border-[#d8dccf] rounded-md text-[#20221f] focus:ring-2 focus:ring-[#20221f] focus:border-transparent transition-all outline-none"
              placeholder="••••••••••••"
            />
          </div>
          {errors.password && <p className="text-[#7b1d17] text-xs font-bold mt-1 ml-1">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="button secondary w-full py-3 flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white" />
          ) : (
            <>
              <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              <span>{t('loginButton')}</span>
            </>
          )}
        </button>
      </form>

      {limitExceeded && (
        <SessionLimitModal
          sessions={limitExceeded.sessions}
          onClose={() => setLimitExceeded(null)}
        />
      )}
    </div>
  )
}

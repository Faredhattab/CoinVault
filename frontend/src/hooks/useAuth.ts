'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { authService } from '@/services/auth-service'
import { UserProfile, Session } from '../../../shared/types/auth'

export function useAuth() {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const initAuth = async () => {
      const currentUser = await authService.getCurrentUser()
      setUser(currentUser)
      setLoading(false)
    }

    initAuth()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, supabaseSession) => {
      if (supabaseSession) {
        const currentUser = await authService.getCurrentUser()
        setUser(currentUser)
      } else {
        setUser(null)
        setSession(null)
      }
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    return await authService.login({ email, password })
  }

  const logout = async () => {
    await authService.logout()
    setUser(null)
    setSession(null)
  }

  const revokeSession = async (sessionId: string) => {
    await authService.revokeSession(sessionId)
  }

  return {
    user,
    session,
    loading,
    login,
    logout,
    revokeSession
  }
}

import { supabase } from '@/lib/supabase'
import { LoginRequest, AuthResponse, UserProfile } from '../../../shared/types/auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

export const authService = {
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: credentials.email,
        password: credentials.password,
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Login failed')
    }

    const authData: AuthResponse = await response.json()

    // Set session in Supabase client for subsequent calls
    const { error } = await supabase.auth.setSession({
      access_token: authData.access_token,
      refresh_token: authData.refresh_token,
    })

    if (error) throw error

    return authData
  },

  async logout() {
    try {
      // Call backend logout
      const { data: { session } } = await supabase.auth.getSession()
      if (session) {
        await fetch(`${API_BASE_URL}/api/v1/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })
      }
    } catch (err) {
      console.error('Backend logout failed:', err)
    } finally {
      // Always clear local session
      const { error } = await supabase.auth.signOut()
      if (error) throw error
    }
  },

  async revokeSession(sessionId: string) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const response = await fetch(`${API_BASE_URL}/api/v1/auth/sessions/${sessionId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Failed to revoke session')
    }
  },

  async getCurrentUser(): Promise<UserProfile | null> {
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) return null

    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) return null

      return await response.json()
    } catch (err) {
      console.error('Failed to fetch user profile from backend:', err)
      
      // Fallback to Supabase user if backend is down but session is valid
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      return {
        id: user.id,
        email: user.email!,
        role: (user.app_metadata?.role as any) || 'user',
        linked_providers: user.identities?.map(i => i.provider) || [],
        created_at: user.created_at,
        updated_at: user.updated_at || user.created_at,
      }
    }
  }
}

import { supabase } from '@/lib/supabase'
import { LoginRequest, AuthResponse, UserProfile } from '../../../shared/types/auth'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'
const USER_CACHE_KEY = 'coinvault_user_cache'

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
      // If the error detail is an object, it might be a structured error (like session_limit_exceeded)
      if (typeof errorData.detail === 'object' && errorData.detail !== null) {
        const error = new Error(errorData.detail.message || 'Login failed') as any
        error.data = errorData.detail
        throw error
      }
      throw new Error(errorData.detail || 'Login failed')
    }

    const authData: AuthResponse = await response.json()

    // Cache user data for quick access after redirect
    if (authData.user) {
      sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(authData.user))
    }

    // Set session in Supabase client - wait for it to complete
    const { error } = await supabase.auth.setSession({
      access_token: authData.access_token,
      refresh_token: authData.refresh_token,
    })

    if (error) {
      console.error('Supabase setSession error:', error)
    }

    return authData
  },

  async logout() {
    // Clear cached user
    sessionStorage.removeItem(USER_CACHE_KEY)

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

  async getSessions() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const response = await fetch(`${API_BASE_URL}/api/v1/auth/sessions`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail || 'Failed to fetch sessions')
    }

    return await response.json()
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
    // First check cache for instant load after login
    const cached = sessionStorage.getItem(USER_CACHE_KEY)
    if (cached) {
      try {
        return JSON.parse(cached)
      } catch {
        sessionStorage.removeItem(USER_CACHE_KEY)
      }
    }

    // Check if we have a session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) return null

    // Fetch from backend with timeout
    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 3000)

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      if (!response.ok) return null

      const user = await response.json()
      // Cache the result
      sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(user))
      return user
    } catch (err) {
      // Fallback to Supabase user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const profile: UserProfile = {
        id: user.id,
        email: user.email!,
        role: (user.app_metadata?.role as any) || 'user',
        linked_providers: user.identities?.map(i => i.provider) || [],
        created_at: user.created_at,
        updated_at: user.updated_at || user.created_at,
      }

      // Cache the fallback
      sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(profile))
      return profile
    }
  },

  async initiateGoogleOAuth(mode: 'login' | 'link' = 'login'): Promise<string> {
    const { data: { session } } = await supabase.auth.getSession()

    if (mode === 'link') {
      // For linking, call the link endpoint (requires auth)
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/link/google`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail?.message || errorData.detail || 'Failed to initiate OAuth linking')
      }

      const data = await response.json()
      return data.oauth_redirect_url
    } else {
      // For login, call the initiate endpoint (no auth required)
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/oauth/google`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail?.message || errorData.detail || 'Failed to initiate OAuth flow')
      }

      const data = await response.json()
      return data.oauth_url
    }
  },

  async unlinkGoogleAccount(): Promise<void> {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) throw new Error('Not authenticated')

    const response = await fetch(`${API_BASE_URL}/api/v1/auth/link/google`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.detail?.message || errorData.detail || 'Failed to unlink Google account')
    }

    sessionStorage.removeItem(USER_CACHE_KEY)
  },

  async loginWithGoogle(code: string): Promise<{ success: boolean; user?: UserProfile }> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/auth/oauth/google/callback?code=${code}`, {
        method: 'GET',
      })

      if (!response.ok) {
        const errorData = await response.json()
        const error = new Error(errorData.detail?.message || errorData.detail || 'OAuth login failed') as any
        error.status = response.status
        throw error
      }

      const authData: AuthResponse = await response.json()

      // Cache user data
      if (authData.user) {
        sessionStorage.setItem(USER_CACHE_KEY, JSON.stringify(authData.user))
      }

      // Set session in Supabase client
      const { error } = await supabase.auth.setSession({
        access_token: authData.access_token,
        refresh_token: authData.refresh_token,
      })

      if (error) {
        console.error('Supabase setSession error:', error)
        return { success: false }
      }

      return { success: true, user: authData.user }
    } catch (error) {
      console.error('Google login error:', error)
      throw error
    }
  },

  async linkGoogleAccount(code: string): Promise<{ success: boolean; message?: string }> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('Not authenticated')

      const response = await fetch(`${API_BASE_URL}/api/v1/auth/oauth/google/callback?code=${code}&link=true`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail?.message || errorData.detail || 'Failed to link Google account')
      }

      sessionStorage.removeItem(USER_CACHE_KEY)
      return { success: true, message: 'Google account linked successfully' }
    } catch (error: any) {
      return { success: false, message: error.message }
    }
  }
}

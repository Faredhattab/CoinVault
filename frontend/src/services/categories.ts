import { supabase } from '@/lib/supabase'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

export interface Category {
  uuid: string
  name_en: string
  name_ar: string | null
  parent_uuid: string | null
  created_at: string
  updated_at: string
}

export interface CategoryCreate {
  name_en: string
  name_ar?: string | null
  parent_uuid?: string | null
}

export interface CategoryUpdate {
  name_en?: string
  name_ar?: string | null
  parent_uuid?: string | null
}

async function getHeaders(authRequired: boolean = false): Promise<HeadersInit> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (authRequired) {
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }
  }

  return headers
}

export const categoriesService = {
  async listCategories(): Promise<Category[]> {
    const headers = await getHeaders(false)
    const response = await fetch(`${API_BASE_URL}/api/v1/categories`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || '')
    }

    return response.json()
  },

  async getCategory(uuid: string): Promise<Category> {
    const headers = await getHeaders(false)
    const response = await fetch(`${API_BASE_URL}/api/v1/categories/${uuid}`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || '')
    }

    return response.json()
  },

  async createCategory(category: CategoryCreate): Promise<Category> {
    const headers = await getHeaders(true)
    const response = await fetch(`${API_BASE_URL}/api/v1/categories`, {
      method: 'POST',
      headers,
      body: JSON.stringify(category),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || '')
    }

    return response.json()
  },

  async updateCategory(uuid: string, category: CategoryUpdate): Promise<Category> {
    const headers = await getHeaders(true)
    const response = await fetch(`${API_BASE_URL}/api/v1/categories/${uuid}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(category),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || '')
    }

    return response.json()
  },

  async deleteCategory(uuid: string): Promise<void> {
    const headers = await getHeaders(true)
    const response = await fetch(`${API_BASE_URL}/api/v1/categories/${uuid}`, {
      method: 'DELETE',
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || '')
    }
  },
}

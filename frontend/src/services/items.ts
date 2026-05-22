import { supabase } from '@/lib/supabase'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'

export interface CategoryInItem {
  uuid: string
  name_en: string
  name_ar: string | null
  parent_uuid: string | null
  created_at: string
  updated_at: string
}

export interface Item {
  uuid: string
  collection_id: string
  type: 'Coin' | 'Banknote'
  title_en: string
  title_ar: string | null
  description_en: string | null
  description_ar: string | null
  country_code: string
  denomination: string
  year: number
  amount: number
  acquisition_year: number | null
  visibility: 'Public' | 'Private'
  tags: string[]
  front_image: string | null
  back_image: string | null
  additional_images: string[]
  created_at: string
  updated_at: string
  categories: CategoryInItem[]
}

export interface PublicItem {
  uuid: string
  collection_id: string
  type: 'Coin' | 'Banknote'
  title_en: string
  title_ar: string | null
  description_en: string | null
  description_ar: string | null
  country_code: string
  denomination: string
  year: number
  visibility: 'Public'
  tags: string[]
  front_image: string | null
  back_image: string | null
  additional_images: string[]
  created_at: string
  updated_at: string
  categories: CategoryInItem[]
}

export interface ItemCreate {
  type: 'Coin' | 'Banknote'
  title_en: string
  title_ar?: string | null
  description_en?: string | null
  description_ar?: string | null
  country_code: string
  denomination: string
  year: number
  amount?: number
  acquisition_year?: number | null
  visibility?: 'Public' | 'Private'
  tags?: string[]
  front_image?: string | null
  back_image?: string | null
  additional_images?: string[]
  category_uuids?: string[]
}

export interface ItemUpdate {
  type?: 'Coin' | 'Banknote'
  title_en?: string
  title_ar?: string | null
  description_en?: string | null
  description_ar?: string | null
  country_code?: string
  denomination?: string
  year?: number
  amount?: number
  acquisition_year?: number | null
  visibility?: 'Public' | 'Private'
  tags?: string[]
  front_image?: string | null
  back_image?: string | null
  additional_images?: string[]
  category_uuids?: string[]
}

export interface ListItemsParams {
  type?: 'Coin' | 'Banknote'
  country_code?: string
  category_uuid?: string
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
  } else {
    // If not strictly required, still try to pass token to allow admin detection
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }
  }

  return headers
}

export const itemsService = {
  async listItems(params?: ListItemsParams): Promise<(Item | PublicItem)[]> {
    const headers = await getHeaders(false)
    const query = new URLSearchParams()
    if (params?.type) query.append('type', params.type)
    if (params?.country_code) query.append('country_code', params.country_code)
    if (params?.category_uuid) query.append('category_uuid', params.category_uuid)

    const response = await fetch(`${API_BASE_URL}/api/v1/items?${query.toString()}`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || '')
    }

    return response.json()
  },

  async getItem(uuid: string): Promise<Item | PublicItem> {
    const headers = await getHeaders(false)
    const response = await fetch(`${API_BASE_URL}/api/v1/items/${uuid}`, {
      method: 'GET',
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || '')
    }

    return response.json()
  },

  async createItem(item: ItemCreate): Promise<Item> {
    const headers = await getHeaders(true)
    const response = await fetch(`${API_BASE_URL}/api/v1/items`, {
      method: 'POST',
      headers,
      body: JSON.stringify(item),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || '')
    }

    return response.json()
  },

  async updateItem(uuid: string, item: ItemUpdate): Promise<Item> {
    const headers = await getHeaders(true)
    const response = await fetch(`${API_BASE_URL}/api/v1/items/${uuid}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(item),
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || '')
    }

    return response.json()
  },

  async deleteItem(uuid: string): Promise<void> {
    const headers = await getHeaders(true)
    const response = await fetch(`${API_BASE_URL}/api/v1/items/${uuid}`, {
      method: 'DELETE',
      headers,
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.detail || '')
    }
  },
}

'use client'

import { useAuth } from '@/hooks/useAuth'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect } from 'react'

interface RoleGuardProps {
  children: React.ReactNode
  requiredRole: string
}

export function RoleGuard({ children, requiredRole }: RoleGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (!loading && user && user.role !== requiredRole) {
      const locale = pathname.split('/')[1] || 'en'
      router.push(`/${locale}/forbidden`)
    }
  }, [user, loading, router, pathname, requiredRole])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" role="status">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#20221f]"></div>
        <span className="sr-only">Loading...</span>
      </div>
    )
  }

  if (!user || user.role !== requiredRole) {
    return null
  }

  return <>{children}</>
}

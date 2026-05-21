'use client'

import { useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ShieldX } from 'lucide-react'

export default function ForbiddenPage() {
  const router = useRouter()
  const params = useParams()
  const locale = params?.locale as string || 'en'
  const t = useTranslations('roles')

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f7f7f2] p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
        <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
          <ShieldX className="w-8 h-8 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-[#20221f] mb-2">
          {t('forbiddenTitle')}
        </h1>
        <p className="text-[#5d6558] mb-6">
          {t('forbiddenMessage')}
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={() => router.push(`/${locale}/login`)}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-[#20221f] text-white hover:bg-[#3e443b] transition-colors"
          >
            {t('backToLogin')}
          </button>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 rounded-lg text-sm font-medium text-[#5d6558] border border-[#d8dccf] hover:bg-[#f7f7f2] transition-colors"
          >
            {t('goBack')}
          </button>
        </div>
      </div>
    </div>
  )
}

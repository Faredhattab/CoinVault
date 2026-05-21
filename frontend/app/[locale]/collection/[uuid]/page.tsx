'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { itemsService, PublicItem } from '@/services/items'
import { normalizeLocale } from '@/i18n'
import { 
  Loader2, 
  Coins, 
  FileText, 
  Tag, 
  Calendar, 
  Globe, 
  ArrowLeft,
  Search,
  ChevronRight,
  ChevronLeft
} from 'lucide-react'

export default function PublicItemDetailPage({
  params: paramsPromise,
}: {
  params: Promise<{ locale: string; uuid: string }>
}) {
  const params = use(paramsPromise)
  const locale = normalizeLocale(params.locale)
  const uuid = params.uuid
  const router = useRouter()

  const [item, setItem] = useState<PublicItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchItem = async () => {
      try {
        setLoading(true)
        setError(null)
        const data = await itemsService.getItem(uuid)
        setItem(data as PublicItem)
      } catch (err: any) {
        // Handle 404 and other access control errors
        setError(err.message || 'Item not found or you do not have permission to view it.')
      } finally {
        setLoading(false)
      }
    }

    if (uuid) {
      fetchItem()
    }
  }, [uuid])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f7f7f2] flex flex-col justify-center items-center text-[#5d6558] p-6">
        <Loader2 className="w-10 h-10 animate-spin mb-4 text-[#20221f]" />
        <span className="font-semibold text-lg">Loading item showcase...</span>
      </div>
    )
  }

  if (error || !item) {
    return (
      <div className="min-h-screen bg-[#f7f7f2] flex flex-col justify-center items-center text-center px-4">
        <div className="p-4 bg-white rounded-full border border-[#d8dccf] shadow-sm mb-4">
          <Globe className="w-12 h-12 text-[#5d6558]" />
        </div>
        <h1 className="text-3xl font-extrabold text-[#20221f] tracking-tight">404 - Item Not Found</h1>
        <p className="text-[#5d6558] mt-2 max-w-md text-sm sm:text-base">
          The requested coin or banknote could not be found, or it is set to private.
        </p>
        <Link
          href={`/${locale}`}
          className="mt-6 px-6 py-2.5 bg-[#20221f] text-white hover:bg-black font-bold rounded-lg transition-colors text-sm shadow-sm"
        >
          Return to Gallery
        </Link>
      </div>
    )
  }

  // Translation fallback logic
  const title = locale === 'ar' ? (item.title_ar || item.title_en) : item.title_en
  const description = locale === 'ar' ? (item.description_ar || item.description_en) : item.description_en

  return (
    <div className="min-h-screen bg-[#f7f7f2] text-[#20221f] pb-16">
      {/* Navigation Header */}
      <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 border-b border-[#d8dccf]">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link
            href={`/${locale}`}
            className="inline-flex items-center gap-2 text-sm font-bold text-[#3e443b] hover:text-[#20221f] transition-all"
          >
            {locale === 'ar' ? (
              <>
                <ChevronRight className="w-4 h-4" />
                <span>العودة للمعرض</span>
              </>
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Back to Gallery</span>
              </>
            )}
          </Link>

          <div className="flex items-center gap-3">
            <span className="font-mono text-xs font-bold bg-[#f7f7f2] border border-[#d8dccf] px-2.5 py-1 rounded text-[#5d6558]">
              {item.collection_id}
            </span>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-5xl mx-auto px-4 mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Images Section */}
          <div className="space-y-6">
            {/* Main Showcase */}
            <div className="bg-white border border-[#d8dccf] rounded-2xl overflow-hidden shadow-sm aspect-[4/3] flex items-center justify-center p-4 relative group">
              {item.front_image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.front_image}
                  alt={`${title} - Front`}
                  className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex flex-col items-center justify-center text-[#5d6558]">
                  {item.type === 'Coin' ? <Coins className="w-16 h-16 opacity-30" /> : <FileText className="w-16 h-16 opacity-30" />}
                  <span className="text-xs font-medium mt-2">No front image available</span>
                </div>
              )}
              <div className="absolute bottom-3 left-3 bg-[#20221f]/75 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider backdrop-blur-sm">
                Front View
              </div>
            </div>

            {/* Back Image & Gallery Grid */}
            {item.back_image && (
              <div className="bg-white border border-[#d8dccf] rounded-2xl overflow-hidden shadow-sm aspect-[4/3] flex items-center justify-center p-4 relative group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={item.back_image}
                  alt={`${title} - Back`}
                  className="max-w-full max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
                <div className="absolute bottom-3 left-3 bg-[#20221f]/75 text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider backdrop-blur-sm">
                  Back View
                </div>
              </div>
            )}
          </div>

          {/* Details Section */}
          <div className="space-y-6">
            {/* Title / Header Card */}
            <div className="bg-white p-6 rounded-2xl border border-[#d8dccf] shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  item.type === 'Coin' 
                    ? 'bg-amber-50 text-amber-700 border-amber-200' 
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {item.type === 'Coin' ? <Coins className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                  <span>{item.type}</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#f7f7f2] border border-[#d8dccf] text-[#3e443b]">
                  <Globe className="w-3 h-3" />
                  <span>{item.country_code}</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#20221f] leading-snug">
                {title}
              </h1>

              {locale === 'ar' && item.title_ar !== item.title_en && (
                <p className="text-sm text-[#5d6558] mt-1 font-sans font-medium" dir="ltr">{item.title_en}</p>
              )}
              {locale === 'en' && item.title_ar && item.title_ar !== item.title_en && (
                <p className="text-sm text-[#5d6558] mt-1 font-sans font-medium text-right" dir="rtl">{item.title_ar}</p>
              )}

              <p className="text-xl font-bold text-[#5d6558] mt-2 border-t border-[#f7f7f2] pt-2">
                {item.denomination}
              </p>
            </div>

            {/* Catalog Info Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-xl border border-[#d8dccf] shadow-sm flex items-center gap-3">
                <div className="p-2 bg-[#f7f7f2] text-[#20221f] rounded-lg">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#5d6558] tracking-wider">Year</div>
                  <div className="text-base font-extrabold text-[#20221f]">{item.year}</div>
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-[#d8dccf] shadow-sm flex items-center gap-3">
                <div className="p-2 bg-[#f7f7f2] text-[#20221f] rounded-lg">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#5d6558] tracking-wider">Origin</div>
                  <div className="text-base font-extrabold text-[#20221f]">{item.country_code}</div>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white p-6 rounded-2xl border border-[#d8dccf] shadow-sm">
              <h3 className="text-sm font-bold text-[#5d6558] uppercase tracking-wider border-b border-[#f7f7f2] pb-2 mb-3">
                History & Specifications
              </h3>
              {description ? (
                <p className="text-sm leading-relaxed text-[#3e443b] whitespace-pre-line font-medium">
                  {description}
                </p>
              ) : (
                <p className="text-sm text-[#5d6558] italic">
                  No description provided for this catalog item.
                </p>
              )}
            </div>

            {/* Categories */}
            {item.categories && item.categories.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-[#d8dccf] shadow-sm">
                <h3 className="text-sm font-bold text-[#5d6558] uppercase tracking-wider border-b border-[#f7f7f2] pb-2 mb-3">
                  Categories
                </h3>
                <div className="flex flex-wrap gap-2">
                  {item.categories.map((cat) => (
                    <span 
                      key={cat.uuid}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#f7f7f2] border border-[#d8dccf] text-xs font-bold text-[#3e443b]"
                    >
                      <Tag className="w-3.5 h-3.5 text-[#5d6558]" />
                      {locale === 'ar' ? (cat.name_ar || cat.name_en) : cat.name_en}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            {item.tags && item.tags.length > 0 && (
              <div className="bg-white p-6 rounded-2xl border border-[#d8dccf] shadow-sm">
                <h3 className="text-sm font-bold text-[#5d6558] uppercase tracking-wider border-b border-[#f7f7f2] pb-2 mb-3">
                  Gallery Tags
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {item.tags.map((tag, idx) => (
                    <span 
                      key={idx}
                      className="px-2.5 py-1 rounded bg-[#f7f7f2] border border-[#d8dccf]/40 text-xs font-medium text-[#5d6558]"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

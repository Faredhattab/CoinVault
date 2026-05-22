'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { itemsService, Item, PublicItem } from '@/services/items'
import { categoriesService, Category } from '@/services/categories'
import { normalizeLocale } from '@/i18n'
import { 
  Plus, 
  Edit, 
  Trash2, 
  ExternalLink, 
  Filter, 
  Search, 
  Loader2, 
  Coins, 
  FileText, 
  Eye, 
  EyeOff, 
  Tag,
  AlertCircle 
} from 'lucide-react'

export default function AdminItemsPage({
  params: paramsPromise,
}: {
  params: Promise<{ locale: string }>
}) {
  const params = use(paramsPromise)
  const locale = normalizeLocale(params.locale)
  const router = useRouter()
  const t = useTranslations('items')

  const [items, setItems] = useState<(Item | PublicItem)[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Filters State
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<string>('')
  const [filterCategory, setFilterCategory] = useState<string>('')

  const fetchData = async () => {
    try {
      setLoading(true)
      setError(null)
      const [itemsData, categoriesData] = await Promise.all([
        itemsService.listItems(),
        categoriesService.listCategories()
      ])
      setItems(itemsData)
      setCategories(categoriesData)
    } catch (err: any) {
      setError(err.message || t('fetchError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleDelete = async (item: Item | PublicItem) => {
    const title = locale === 'ar' ? (item.title_ar || item.title_en) : item.title_en
    if (!confirm(t('deleteConfirm', { title }))) {
      return
    }

    try {
      setError(null)
      setSuccess(null)
      await itemsService.deleteItem(item.uuid)
      setSuccess(t('deleted', { title }))
      await fetchData()
    } catch (err: any) {
      setError(err.message || t('deleteError'))
    }
  }

  const getFilteredItems = () => {
    return items.filter((item) => {
      // Search filter (collection_id, title_en, title_ar, denomination)
      const query = searchQuery.toLowerCase()
      const matchesSearch = 
        item.collection_id.toLowerCase().includes(query) ||
        item.title_en.toLowerCase().includes(query) ||
        (item.title_ar && item.title_ar.toLowerCase().includes(query)) ||
        item.denomination.toLowerCase().includes(query) ||
        item.country_code.toLowerCase().includes(query)

      // Type filter
      const matchesType = !filterType || item.type === filterType

      // Category filter
      const matchesCategory = !filterCategory || item.categories.some(c => c.uuid === filterCategory)

      return matchesSearch && matchesType && matchesCategory
    })
  }

  const filteredItems = getFilteredItems()

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 border-b border-[#d8dccf] pb-4">
        <div>
          <h1 className="text-3xl font-bold text-[#20221f]">{t('title')}</h1>
          <p className="text-sm text-[#5d6558] mt-1">
            {t('description')}
          </p>
        </div>
        <Link
          href={`/${locale}/admin/items/create`}
          className="py-2.5 px-4 bg-[#20221f] text-white hover:bg-black font-bold rounded-lg transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>{t('addItem')}</span>
        </Link>
      </div>

      {/* Alert Banners */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold">{t('error')}</h4>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg flex items-start gap-3">
          <div className="w-5 h-5 bg-green-200 text-green-800 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
            ✓
          </div>
          <div>
            <h4 className="font-bold">{t('success')}</h4>
            <p className="text-sm">{success}</p>
          </div>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-[#d8dccf] shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-stretch md:items-center">
        {/* Search */}
        <div className="flex-1 relative">
          <Search className="w-5 h-5 text-[#5d6558] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-[#d8dccf] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#20221f]/10 focus:border-[#20221f] transition-all bg-[#f7f7f2]/30 text-sm"
          />
        </div>

        {/* Type Filter */}
        <div className="w-full md:w-48">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="w-full px-3 py-2 border border-[#d8dccf] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#20221f]/10 focus:border-[#20221f] transition-all bg-white text-sm"
          >
            <option value="">{t('allTypes')}</option>
            <option value="Coin">{t('coins')}</option>
            <option value="Banknote">{t('banknotes')}</option>
          </select>
        </div>

        {/* Category Filter */}
        <div className="w-full md:w-56">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="w-full px-3 py-2 border border-[#d8dccf] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#20221f]/10 focus:border-[#20221f] transition-all bg-white text-sm"
          >
            <option value="">{t('allCategories')}</option>
            {categories.map((cat) => (
              <option key={cat.uuid} value={cat.uuid}>
                {cat.name_en} {cat.name_ar ? `(${cat.name_ar})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-24 text-[#5d6558]">
          <Loader2 className="w-8 h-8 animate-spin mr-2" />
          <span className="font-medium text-lg">{t('loading')}</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#d8dccf] shadow-sm p-12 text-center">
          <div className="inline-flex p-4 bg-[#f7f7f2] text-[#5d6558] rounded-full mb-4">
            <Coins className="w-12 h-12" />
          </div>
          <h3 className="text-xl font-bold text-[#20221f]">{t('noItemsTitle')}</h3>
          <p className="text-[#5d6558] mt-2 max-w-md mx-auto text-sm">
            {searchQuery || filterType || filterCategory
              ? t('noItemsFiltered')
              : t('noItemsEmpty')}
          </p>
          {(searchQuery || filterType || filterCategory) && (
            <button
              onClick={() => {
                setSearchQuery('')
                setFilterType('')
                setFilterCategory('')
              }}
              className="mt-4 px-4 py-2 bg-[#f7f7f2] hover:bg-[#d8dccf] text-[#20221f] font-bold rounded-lg transition-colors text-sm"
            >
              {t('clearFilters')}
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-[#d8dccf] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f7f7f2] border-b border-[#d8dccf]">
                  <th className="px-6 py-4 text-xs font-bold text-[#5d6558] uppercase tracking-wider">{t('colId')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#5d6558] uppercase tracking-wider">{t('colDetails')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#5d6558] uppercase tracking-wider">{t('colCountry')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#5d6558] uppercase tracking-wider">{t('colStock')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#5d6558] uppercase tracking-wider">{t('colVisibility')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#5d6558] uppercase tracking-wider">{t('colCategories')}</th>
                  <th className="px-6 py-4 text-xs font-bold text-[#5d6558] uppercase tracking-wider text-right">{t('colActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f7f7f2]">
                {filteredItems.map((item: any) => {
                  const displayTitle = locale === 'ar' ? (item.title_ar || item.title_en) : item.title_en
                  const isPrivate = item.visibility === 'Private'

                  return (
                    <tr key={item.uuid} className="hover:bg-[#f7f7f2]/20 transition-colors">
                      {/* Collection ID */}
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-sm font-bold text-[#20221f]">
                        {item.collection_id}
                      </td>

                      {/* Item Details */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg flex-shrink-0 ${
                            item.type === 'Coin' 
                              ? 'bg-amber-50 text-amber-700' 
                              : 'bg-emerald-50 text-emerald-700'
                          }`}>
                            {item.type === 'Coin' ? <Coins className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                          </div>
                          <div>
                            <div className="font-bold text-[#20221f] text-sm sm:text-base">{displayTitle}</div>
                            {locale === 'ar' && item.title_ar !== item.title_en && (
                              <div className="text-xs text-[#5d6558]">{item.title_en}</div>
                            )}
                            {locale === 'en' && item.title_ar && item.title_ar !== item.title_en && (
                              <div className="text-xs text-[#5d6558] font-sans" dir="rtl">{item.title_ar}</div>
                            )}
                            <div className="text-xs text-[#5d6558] mt-0.5">{item.denomination}</div>
                          </div>
                        </div>
                      </td>

                      {/* Country & Year */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-[#20221f]">{item.country_code}</div>
                        <div className="text-xs text-[#5d6558]">{item.year}</div>
                      </td>

                      {/* Stock & Value */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-[#20221f]">{t('qty')} {item.amount ?? 0}</div>
                        {item.acquisition_year && (
                          <div className="text-xs text-[#5d6558]">{t('acquired')} {item.acquisition_year}</div>
                        )}
                      </td>

                      {/* Visibility */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          isPrivate 
                            ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                            : 'bg-green-50 text-green-700 border border-green-200'
                        }`}>
                          {isPrivate ? (
                            <>
                              <EyeOff className="w-3.5 h-3.5" />
                              <span>{t('private')}</span>
                            </>
                          ) : (
                            <>
                              <Eye className="w-3.5 h-3.5" />
                              <span>{t('public')}</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Categories Tagging */}
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {item.categories && item.categories.length > 0 ? (
                            item.categories.map((cat: any) => (
                              <span 
                                key={cat.uuid} 
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#f7f7f2] border border-[#d8dccf] text-[10px] font-medium text-[#3e443b]"
                              >
                                <Tag className="w-2.5 h-2.5 text-[#5d6558]" />
                                {locale === 'ar' ? (cat.name_ar || cat.name_en) : cat.name_en}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-[#5d6558] italic">{t('uncategorized')}</span>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/${locale}/collection/${item.uuid}`}
                            target="_blank"
                            title={t('viewPublic')}
                            className="p-1.5 text-[#5d6558] hover:text-[#20221f] hover:bg-[#f7f7f2] rounded transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          <Link
                            href={`/${locale}/admin/items/${item.uuid}/edit`}
                            title={t('editItem')}
                            className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => handleDelete(item)}
                            title={t('deleteItem')}
                            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <div className="bg-[#f7f7f2] px-6 py-3 border-t border-[#d8dccf] text-xs text-[#5d6558] flex justify-between items-center">
            <span>{t('showing', { count: filteredItems.length, total: items.length })}</span>
            <span>{t('totalValue', { count: items.length })}</span>
          </div>
        </div>
      )}
    </div>
  )
}

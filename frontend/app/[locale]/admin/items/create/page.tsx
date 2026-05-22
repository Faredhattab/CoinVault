'use client'

import React, { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { itemsService, ItemCreate } from '@/services/items'
import { categoriesService, Category } from '@/services/categories'
import { normalizeLocale } from '@/i18n'
import { useTranslations } from 'next-intl'
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Coins, 
  FileText, 
  Eye, 
  EyeOff, 
  Image as ImageIcon,
  Tag, 
  AlertCircle 
} from 'lucide-react'

export default function CreateItemPage({
  params: paramsPromise,
}: {
  params: Promise<{ locale: string }>
}) {
  const params = use(paramsPromise)
  const locale = normalizeLocale(params.locale)
  const t = useTranslations('items.create')
  const router = useRouter()

  const [categories, setCategories] = useState<Category[]>([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form Fields
  const [type, setType] = useState<'Coin' | 'Banknote'>('Coin')
  const [titleEn, setTitleEn] = useState('')
  const [titleAr, setTitleAr] = useState('')
  const [descriptionEn, setDescriptionEn] = useState('')
  const [descriptionAr, setDescriptionAr] = useState('')
  const [countryCode, setCountryCode] = useState('')
  const [denomination, setDenomination] = useState('')
  const [year, setYear] = useState<string>('')
  const [amount, setAmount] = useState<number>(1)
  const [acquisitionYear, setAcquisitionYear] = useState<string>('')
  const [visibility, setVisibility] = useState<'Public' | 'Private'>('Public')
  
  // Image URL Fields
  const [frontImage, setFrontImage] = useState('')
  const [backImage, setBackImage] = useState('')
  
  // Category Selection (Array of Category UUIDs)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  // Tags (Comma separated input)
  const [tagsInput, setTagsInput] = useState('')

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true)
        const data = await categoriesService.listCategories()
        setCategories(data)
      } catch (err: any) {
        console.error('Failed to load categories', err)
      } finally {
        setLoadingCategories(false)
      }
    }
    fetchCategories()
  }, [])

  const handleCategoryToggle = (uuid: string) => {
    setSelectedCategories(prev => 
      prev.includes(uuid) 
        ? prev.filter(id => id !== uuid) 
        : [...prev, uuid]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    // Validations
    if (!titleEn.trim()) {
      setError(t('titleRequired'))
      return
    }
    const cleanCountry = countryCode.trim().toUpperCase()
    if (!/^[A-Z]{2}$/.test(cleanCountry)) {
      setError(t('countryInvalid'))
      return
    }
    if (!denomination.trim()) {
      setError(t('denomRequired'))
      return
    }
    const numericYear = parseInt(year)
    if (isNaN(numericYear) || numericYear < 0) {
      setError(t('yearInvalid'))
      return
    }
    if (amount < 0) {
      setError(t('amountInvalid'))
      return
    }

    let numericAcqYear: number | null = null
    if (acquisitionYear.trim()) {
      numericAcqYear = parseInt(acquisitionYear)
      if (isNaN(numericAcqYear) || numericAcqYear < 0) {
        setError(t('acquisitionInvalid'))
        return
      }
    }

    try {
      setSubmitLoading(true)

      const tags = tagsInput
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0)

      const payload: ItemCreate = {
        type,
        title_en: titleEn.trim(),
        title_ar: titleAr.trim() || null,
        description_en: descriptionEn.trim() || null,
        description_ar: descriptionAr.trim() || null,
        country_code: cleanCountry,
        denomination: denomination.trim(),
        year: numericYear,
        amount,
        acquisition_year: numericAcqYear,
        visibility,
        tags,
        front_image: frontImage.trim() || null,
        back_image: backImage.trim() || null,
        category_uuids: selectedCategories
      }

      const newItem = await itemsService.createItem(payload)
      setSuccess(t('created', { id: newItem.collection_id }))
      
      // Redirect back after a short delay
      setTimeout(() => {
        router.push(`/${locale}/admin/items`)
      }, 1500)

    } catch (err: any) {
      setError(err.message || t('createError'))
      setSubmitLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Back Link */}
      <div className="mb-4">
        <Link
          href={`/${locale}/admin/items`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#5d6558] hover:text-[#20221f] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('backToItems')}</span>
        </Link>
      </div>

      {/* Header */}
      <div className="border-b border-[#d8dccf] pb-4 mb-6">
        <h1 className="text-3xl font-bold text-[#20221f]">{t('title')}</h1>
        <p className="text-sm text-[#5d6558] mt-1">
          {t('description')}
        </p>
      </div>

      {/* Banners */}
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

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Core Type & Visibility selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-xl border border-[#d8dccf] shadow-sm">
          <div>
            <label className="block text-sm font-bold text-[#20221f] mb-2">{t('itemType')}</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setType('Coin')}
                className={`py-3 px-4 rounded-lg border font-bold flex items-center justify-center gap-2 transition-all ${
                  type === 'Coin'
                    ? 'border-[#20221f] bg-[#20221f] text-white shadow-sm'
                    : 'border-[#d8dccf] bg-[#f7f7f2]/30 text-[#3e443b] hover:bg-[#f7f7f2]'
                }`}
              >
                <Coins className="w-5 h-5" />
                <span>{t('coin')}</span>
              </button>
              <button
                type="button"
                onClick={() => setType('Banknote')}
                className={`py-3 px-4 rounded-lg border font-bold flex items-center justify-center gap-2 transition-all ${
                  type === 'Banknote'
                    ? 'border-[#20221f] bg-[#20221f] text-white shadow-sm'
                    : 'border-[#d8dccf] bg-[#f7f7f2]/30 text-[#3e443b] hover:bg-[#f7f7f2]'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span>{t('banknote')}</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-[#20221f] mb-2">{t('visibility')}</label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setVisibility('Public')}
                className={`py-3 px-4 rounded-lg border font-bold flex items-center justify-center gap-2 transition-all ${
                  visibility === 'Public'
                    ? 'border-green-600 bg-green-50 text-green-700 border-2'
                    : 'border-[#d8dccf] bg-[#f7f7f2]/30 text-[#3e443b] hover:bg-[#f7f7f2]'
                }`}
              >
                <Eye className="w-5 h-5" />
                <span>{t('publicLink')}</span>
              </button>
              <button
                type="button"
                onClick={() => setVisibility('Private')}
                className={`py-3 px-4 rounded-lg border font-bold flex items-center justify-center gap-2 transition-all ${
                  visibility === 'Private'
                    ? 'border-rose-600 bg-rose-50 text-rose-700 border-2'
                    : 'border-[#d8dccf] bg-[#f7f7f2]/30 text-[#3e443b] hover:bg-[#f7f7f2]'
                }`}
              >
                <EyeOff className="w-5 h-5" />
                <span>{t('privateOnly')}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Localized Titles and Descriptions */}
        <div className="bg-white p-6 rounded-xl border border-[#d8dccf] shadow-sm space-y-6">
          <h2 className="text-lg font-bold text-[#20221f] border-b border-[#f7f7f2] pb-2">
            {t('multilingualSection')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* English Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#5d6558] uppercase tracking-wider flex items-center gap-1.5">
                <span>{t('englishLocale')}</span>
                <span className="text-red-500">{t('required')}</span>
              </h3>
              <div>
                <label htmlFor="title-en" className="block text-xs font-bold text-[#20221f] mb-1">{t('titleLabel')}</label>
                <input
                  id="title-en"
                  type="text"
                  required
                  placeholder={t('titlePlaceholder')}
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d8dccf] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#20221f]/10 focus:border-[#20221f] transition-all text-sm"
                />
              </div>
              <div>
                <label htmlFor="desc-en" className="block text-xs font-bold text-[#20221f] mb-1">{t('descriptionLabel')}</label>
                <textarea
                  id="desc-en"
                  rows={4}
                  placeholder={t('descriptionPlaceholder')}
                  value={descriptionEn}
                  onChange={(e) => setDescriptionEn(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d8dccf] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#20221f]/10 focus:border-[#20221f] transition-all text-sm"
                />
              </div>
            </div>

            {/* Arabic Section */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-[#5d6558] uppercase tracking-wider flex items-center gap-1.5">
                <span>{t('arabicLocale')}</span>
                <span className="text-xs text-gray-400 font-normal">{t('arabicOptional')}</span>
              </h3>
              <div>
                <label htmlFor="title-ar" className="block text-xs font-bold text-[#20221f] mb-1 text-right" dir="rtl">{t('arabicTitleLabel')}</label>
                <input
                  id="title-ar"
                  type="text"
                  placeholder={t('arabicTitlePlaceholder')}
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                  dir="rtl"
                  className="w-full px-3 py-2 border border-[#d8dccf] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#20221f]/10 focus:border-[#20221f] transition-all text-sm font-sans"
                />
              </div>
              <div>
                <label htmlFor="desc-ar" className="block text-xs font-bold text-[#20221f] mb-1 text-right" dir="rtl">{t('arabicDescLabel')}</label>
                <textarea
                  id="desc-ar"
                  rows={4}
                  placeholder={t('arabicDescPlaceholder')}
                  value={descriptionAr}
                  onChange={(e) => setDescriptionAr(e.target.value)}
                  dir="rtl"
                  className="w-full px-3 py-2 border border-[#d8dccf] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#20221f]/10 focus:border-[#20221f] transition-all text-sm font-sans"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Physical Attributes & Identifiers */}
        <div className="bg-white p-6 rounded-xl border border-[#d8dccf] shadow-sm">
          <h2 className="text-lg font-bold text-[#20221f] border-b border-[#f7f7f2] pb-2 mb-4">
            {t('catalogSection')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="country-code" className="block text-sm font-bold text-[#20221f] mb-1">
                {t('countryCode')}
              </label>
              <input
                id="country-code"
                type="text"
                required
                maxLength={2}
                placeholder={t('countryPlaceholder')}
                value={countryCode}
                onChange={(e) => setCountryCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-[#d8dccf] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#20221f]/10 focus:border-[#20221f] transition-all text-sm font-mono uppercase"
              />
              <span className="text-[10px] text-[#5d6558] mt-1 block">
                {t('countryHelper')}
              </span>
            </div>

            <div>
              <label htmlFor="denomination" className="block text-sm font-bold text-[#20221f] mb-1">
                {t('denomination')}
              </label>
              <input
                id="denomination"
                type="text"
                required
                placeholder={t('denomPlaceholder')}
                value={denomination}
                onChange={(e) => setDenomination(e.target.value)}
                className="w-full px-3 py-2 border border-[#d8dccf] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#20221f]/10 focus:border-[#20221f] transition-all text-sm"
              />
            </div>

            <div>
              <label htmlFor="year" className="block text-sm font-bold text-[#20221f] mb-1">
                {t('year')}
              </label>
              <input
                id="year"
                type="number"
                required
                min={0}
                placeholder={t('yearPlaceholder')}
                value={year}
                onChange={(e) => setYear(e.target.value)}
                className="w-full px-3 py-2 border border-[#d8dccf] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#20221f]/10 focus:border-[#20221f] transition-all text-sm"
              />
            </div>
          </div>
        </div>

        {/* Private Stock Metadata */}
        <div className="bg-white p-6 rounded-xl border border-[#d8dccf] shadow-sm">
          <h2 className="text-lg font-bold text-[#20221f] border-b border-[#f7f7f2] pb-2 mb-4">
            {t('inventorySection')}
          </h2>
          <p className="text-xs text-[#5d6558] mb-4">
            {t('inventoryHelper')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="amount" className="block text-sm font-bold text-[#20221f] mb-1">
                {t('quantity')}
              </label>
              <input
                id="amount"
                type="number"
                min={0}
                required
                value={amount}
                onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-[#d8dccf] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#20221f]/10 focus:border-[#20221f] transition-all text-sm"
              />
            </div>

            <div>
              <label htmlFor="acq-year" className="block text-sm font-bold text-[#20221f] mb-1">
                {t('acquisitionYear')}
              </label>
              <input
                id="acq-year"
                type="number"
                min={0}
                placeholder={t('acquisitionPlaceholder')}
                value={acquisitionYear}
                onChange={(e) => setAcquisitionYear(e.target.value)}
                className="w-full px-3 py-2 border border-[#d8dccf] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#20221f]/10 focus:border-[#20221f] transition-all text-sm"
              />
            </div>
          </div>
        </div>

        {/* Category Mapping Checkboxes */}
        <div className="bg-white p-6 rounded-xl border border-[#d8dccf] shadow-sm">
          <h2 className="text-lg font-bold text-[#20221f] border-b border-[#f7f7f2] pb-2 mb-4 flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#5d6558]" />
            <span>{t('categorySection')}</span>
          </h2>

          {loadingCategories ? (
            <div className="flex items-center text-[#5d6558] text-sm py-4">
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              <span>{t('loadingCategories')}</span>
            </div>
          ) : categories.length === 0 ? (
            <div className="text-sm text-[#5d6558] italic py-2">
              {t('noCategories')}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-60 overflow-y-auto p-1 border border-[#d8dccf]/30 rounded-lg">
              {categories.map((cat) => {
                const isSelected = selectedCategories.includes(cat.uuid)
                return (
                  <button
                    key={cat.uuid}
                    type="button"
                    onClick={() => handleCategoryToggle(cat.uuid)}
                    className={`p-3 rounded-lg border text-left flex items-start gap-2.5 transition-all ${
                      isSelected
                        ? 'border-[#20221f] bg-[#f7f7f2] text-[#20221f]'
                        : 'border-[#d8dccf]/60 hover:bg-[#f7f7f2]/20 text-[#3e443b]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="mt-0.5 rounded text-[#20221f] focus:ring-[#20221f] border-[#d8dccf]"
                    />
                    <span className="text-xs font-bold leading-tight">
                      {locale === 'ar' ? (cat.name_ar || cat.name_en) : cat.name_en}
                    </span>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        {/* Media & External Links */}
        <div className="bg-white p-6 rounded-xl border border-[#d8dccf] shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-[#20221f] border-b border-[#f7f7f2] pb-2 flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-[#5d6558]" />
            <span>{t('imagesSection')}</span>
          </h2>
          <p className="text-xs text-[#5d6558]">
            {t('imagesHelper')}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="front-img" className="block text-sm font-bold text-[#20221f] mb-1">{t('frontImage')}</label>
              <input
                id="front-img"
                type="url"
                placeholder={t('frontPlaceholder')}
                value={frontImage}
                onChange={(e) => setFrontImage(e.target.value)}
                className="w-full px-3 py-2 border border-[#d8dccf] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#20221f]/10 focus:border-[#20221f] transition-all text-sm"
              />
              {frontImage && (
                <div className="mt-3 relative aspect-video w-full max-w-xs rounded-lg overflow-hidden border border-[#d8dccf]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={frontImage}
                    alt={t('frontAlt')}
                    className="object-contain w-full h-full bg-[#f7f7f2]"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>

            <div>
              <label htmlFor="back-img" className="block text-sm font-bold text-[#20221f] mb-1">{t('backImage')}</label>
              <input
                id="back-img"
                type="url"
                placeholder={t('backPlaceholder')}
                value={backImage}
                onChange={(e) => setBackImage(e.target.value)}
                className="w-full px-3 py-2 border border-[#d8dccf] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#20221f]/10 focus:border-[#20221f] transition-all text-sm"
              />
              {backImage && (
                <div className="mt-3 relative aspect-video w-full max-w-xs rounded-lg overflow-hidden border border-[#d8dccf]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={backImage}
                    alt={t('backAlt')}
                    className="object-contain w-full h-full bg-[#f7f7f2]"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tags */}
        <div className="bg-white p-6 rounded-xl border border-[#d8dccf] shadow-sm">
          <h2 className="text-lg font-bold text-[#20221f] border-b border-[#f7f7f2] pb-2 mb-4">
            {t('tagsSection')}
          </h2>
          <div>
            <label htmlFor="tags-input" className="block text-sm font-bold text-[#20221f] mb-1">
              {t('tagsLabel')}
            </label>
            <input
              id="tags-input"
              type="text"
              placeholder={t('tagsPlaceholder')}
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              className="w-full px-3 py-2 border border-[#d8dccf] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#20221f]/10 focus:border-[#20221f] transition-all text-sm"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 border-t border-[#d8dccf] pt-6">
          <Link
            href={`/${locale}/admin/items`}
            className="py-2.5 px-5 bg-[#f7f7f2] hover:bg-[#d8dccf] text-[#20221f] font-bold rounded-lg transition-colors text-sm"
          >
            {t('cancelBtn')}
          </Link>
          <button
            type="submit"
            disabled={submitLoading}
            className="py-2.5 px-6 bg-[#20221f] text-white hover:bg-black font-bold rounded-lg transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
          >
            {submitLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            <span>{t('saveBtn')}</span>
          </button>
        </div>
      </form>
    </div>
  )
}

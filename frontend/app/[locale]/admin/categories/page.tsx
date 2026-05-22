'use client'

import React, { useState, useEffect, use } from 'react'
import { useTranslations } from 'next-intl'
import { categoriesService, Category } from '@/services/categories'
import { CategoryTree } from '@/components/category-tree'
import { normalizeLocale } from '@/i18n'
import { Loader2, FolderPlus, AlertCircle, Plus } from 'lucide-react'

export default function AdminCategoriesPage({
  params: paramsPromise,
}: {
  params: Promise<{ locale: string }>
}) {
  const params = use(paramsPromise)
  const locale = normalizeLocale(params.locale)
  const t = useTranslations('categories')

  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [submitLoading, setSubmitLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Form State
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [nameEn, setNameEn] = useState('')
  const [nameAr, setNameAr] = useState('')
  const [parentUuid, setParentUuid] = useState('')

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const data = await categoriesService.listCategories()
      setCategories(data)
    } catch (err: any) {
      setError(err.message || t('loadError'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCategories()
  }, [])

  const handleEdit = (category: Category) => {
    setEditingCategory(category)
    setNameEn(category.name_en)
    setNameAr(category.name_ar || '')
    setParentUuid(category.parent_uuid || '')
    setError(null)
    setSuccess(null)
  }

  const handleCancel = () => {
    setEditingCategory(null)
    setNameEn('')
    setNameAr('')
    setParentUuid('')
    setError(null)
    setSuccess(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (!nameEn.trim()) {
      setError(t('nameRequired'))
      return
    }

    try {
      setSubmitLoading(true)
      const payload = {
        name_en: nameEn.trim(),
        name_ar: nameAr.trim() || null,
        parent_uuid: parentUuid || null,
      }

      if (editingCategory) {
        await categoriesService.updateCategory(editingCategory.uuid, payload)
        setSuccess(t('updated'))
      } else {
        await categoriesService.createCategory(payload)
        setSuccess(t('created'))
      }

      handleCancel()
      await fetchCategories()
    } catch (err: any) {
      setError(err.message || t('saveError'))
    } finally {
      setSubmitLoading(false)
    }
  }

  const handleDelete = async (category: Category) => {
    const name = locale === 'ar' ? (category.name_ar || category.name_en) : category.name_en
    if (!confirm(t('deleteConfirm', { name }))) {
      return
    }

    try {
      setError(null)
      setSuccess(null)
      await categoriesService.deleteCategory(category.uuid)
      setSuccess(t('deleted', { name }))
      await fetchCategories()
    } catch (err: any) {
      setError(err.message || t('deleteError'))
    }
  }

  // Filter out self or children from parent options when editing to avoid invalid cycles
  const getParentOptions = () => {
    if (!editingCategory) return categories

    // Quick helper to check if a category is a descendant of the editing category
    const isDescendant = (cat: Category, potentialAncestorUuid: string): boolean => {
      let currentParent = cat.parent_uuid
      while (currentParent) {
        if (currentParent === potentialAncestorUuid) return true
        const parent = categories.find((c) => c.uuid === currentParent)
        currentParent = parent ? parent.parent_uuid : null
      }
      return false
    }

    return categories.filter(
      (cat) =>
        cat.uuid !== editingCategory.uuid && !isDescendant(cat, editingCategory.uuid)
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-[#d8dccf] pb-4">
        <div>
          <h1 className="text-3xl font-bold text-[#20221f]">{t('title')}</h1>
          <p className="text-sm text-[#5d6558] mt-1">
            {t('description')}
          </p>
        </div>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Category Tree List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-6 rounded-xl border border-[#d8dccf] shadow-sm">
            <h2 className="text-lg font-bold text-[#20221f] mb-4 flex items-center gap-2">
              {t('hierarchy')}
            </h2>
            {loading ? (
              <div className="flex justify-center items-center py-12 text-[#5d6558]">
                <Loader2 className="w-6 h-6 animate-spin mr-2" />
                <span>{t('loading')}</span>
              </div>
            ) : (
              <CategoryTree
                categories={categories}
                locale={locale}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            )}
          </div>
        </div>

        {/* Create/Edit Form */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl border border-[#d8dccf] shadow-sm sticky top-24">
            <h2 className="text-lg font-bold text-[#20221f] mb-4 flex items-center gap-2 border-b border-[#f7f7f2] pb-2">
              <FolderPlus className="w-5 h-5 text-[#5d6558]" />
              <span>{editingCategory ? t('editTitle') : t('newTitle')}</span>
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="category-name-en"
                  className="block text-sm font-bold text-[#20221f] mb-1"
                >
                  {t('nameEn')} <span className="text-red-500">*</span>
                </label>
                <input
                  id="category-name-en"
                  type="text"
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  placeholder={t('nameEnPlaceholder')}
                  className="w-full px-3 py-2 border border-[#d8dccf] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#20221f]/10 focus:border-[#20221f] transition-all bg-[#f7f7f2]/30"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="category-name-ar"
                  className="block text-sm font-bold text-[#20221f] mb-1"
                >
                  {t('nameAr')}
                </label>
                <input
                  id="category-name-ar"
                  type="text"
                  value={nameAr}
                  onChange={(e) => setNameAr(e.target.value)}
                  placeholder={t('nameArPlaceholder')}
                  className="w-full px-3 py-2 border border-[#d8dccf] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#20221f]/10 focus:border-[#20221f] transition-all bg-[#f7f7f2]/30"
                  dir="rtl"
                />
              </div>

              <div>
                <label
                  htmlFor="category-parent"
                  className="block text-sm font-bold text-[#20221f] mb-1"
                >
                  {t('parent')}
                </label>
                <select
                  id="category-parent"
                  value={parentUuid}
                  onChange={(e) => setParentUuid(e.target.value)}
                  className="w-full px-3 py-2 border border-[#d8dccf] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#20221f]/10 focus:border-[#20221f] transition-all bg-white"
                >
                  <option value="">{t('parentNone')}</option>
                  {getParentOptions().map((cat) => (
                    <option key={cat.uuid} value={cat.uuid}>
                      {cat.name_en} {cat.name_ar ? `(${cat.name_ar})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <button
                  id="btn-save-category"
                  type="submit"
                  disabled={submitLoading}
                  className="flex-1 py-2 px-4 bg-[#20221f] text-white hover:bg-black font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  {submitLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  <span>{t('save')}</span>
                </button>
                {editingCategory && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="py-2 px-4 bg-[#f7f7f2] hover:bg-[#d8dccf] text-[#20221f] font-bold rounded-lg transition-colors"
                  >
                    {t('cancel')}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

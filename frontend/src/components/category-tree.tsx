'use client'

import React, { useState } from 'react'
import { Category } from '@/services/categories'
import { ChevronRight, ChevronDown, Folder, Edit2, Trash2 } from 'lucide-react'

export interface CategoryTreeProps {
  categories: Category[]
  locale: string
  onEdit?: (category: Category) => void
  onDelete?: (category: Category) => void
  onSelect?: (category: Category) => void
}

interface TreeNode {
  category: Category
  children: TreeNode[]
}

export function CategoryTree({
  categories,
  locale,
  onEdit,
  onDelete,
  onSelect,
}: CategoryTreeProps) {
  // Construct tree hierarchy from flat list
  const buildTree = (flatList: Category[]): TreeNode[] => {
    const map = new Map<string, TreeNode>()
    const roots: TreeNode[] = []

    // First pass: create tree nodes
    flatList.forEach((cat) => {
      map.set(cat.uuid, { category: cat, children: [] })
    })

    // Second pass: associate children with parents
    flatList.forEach((cat) => {
      const node = map.get(cat.uuid)!
      if (cat.parent_uuid && map.has(cat.parent_uuid)) {
        const parentNode = map.get(cat.parent_uuid)!
        parentNode.children.push(node)
      } else {
        roots.push(node)
      }
    })

    return roots
  }

  const treeData = buildTree(categories)

  if (categories.length === 0) {
    return (
      <div className="text-center py-8 text-[#5d6558] italic border border-dashed border-[#d8dccf] rounded bg-white">
        No categories defined yet.
      </div>
    )
  }

  return (
    <div className="space-y-1">
      {treeData.map((node) => (
        <CategoryTreeNodeRenderer
          key={node.category.uuid}
          node={node}
          level={0}
          locale={locale}
          onEdit={onEdit}
          onDelete={onDelete}
          onSelect={onSelect}
        />
      ))}
    </div>
  )
}

interface CategoryTreeNodeRendererProps {
  node: TreeNode
  level: number
  locale: string
  onEdit?: (category: Category) => void
  onDelete?: (category: Category) => void
  onSelect?: (category: Category) => void
}

function CategoryTreeNodeRenderer({
  node,
  level,
  locale,
  onEdit,
  onDelete,
  onSelect,
}: CategoryTreeNodeRendererProps) {
  const [isOpen, setIsOpen] = useState(true)
  const { category, children } = node

  const hasChildren = children.length > 0
  const name = locale === 'ar' ? (category.name_ar || category.name_en) : category.name_en

  return (
    <div className="select-none">
      {/* Node Row */}
      <div
        className="flex items-center justify-between p-2 rounded hover:bg-white hover:shadow-sm border border-transparent hover:border-[#d8dccf] transition-all group"
        style={{
          paddingLeft: locale === 'ar' ? '0.5rem' : `${level * 1.5 + 0.5}rem`,
          paddingRight: locale === 'ar' ? `${level * 1.5 + 0.5}rem` : '0.5rem',
        }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {hasChildren ? (
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-1 rounded text-[#5d6558] hover:bg-[#f7f7f2] transition-colors focus:outline-none"
              aria-label={isOpen ? 'Collapse' : 'Expand'}
            >
              {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          ) : (
            <span className="w-6" /> // spacer
          )}
          <Folder className="w-4 h-4 text-[#5d6558] flex-shrink-0" />
          <span
            onClick={() => onSelect?.(category)}
            className={`text-sm font-medium text-[#20221f] truncate ${
              onSelect ? 'cursor-pointer hover:underline' : ''
            }`}
          >
            {name}
          </span>
          {category.name_ar && locale !== 'ar' && (
            <span className="text-xs text-[#5d6558] italic truncate">({category.name_ar})</span>
          )}
        </div>

        {/* Action Buttons (visible on hover) */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={() => onEdit(category)}
              className="p-1 rounded text-[#5d6558] hover:bg-[#f7f7f2] hover:text-[#20221f] transition-colors"
              title="Edit Category"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(category)}
              id={`btn-delete-${category.name_en.replace(/\s+/g, '-')}`}
              className="p-1 rounded text-red-600 hover:bg-red-50 transition-colors"
              title="Delete Category"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Children Nodes */}
      {hasChildren && isOpen && (
        <div className="mt-0.5 space-y-0.5">
          {children.map((childNode) => (
            <CategoryTreeNodeRenderer
              key={childNode.category.uuid}
              node={childNode}
              level={level + 1}
              locale={locale}
              onEdit={onEdit}
              onDelete={onDelete}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  )
}

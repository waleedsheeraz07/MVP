'use client'

import { useState, useMemo, useEffect, useRef } from 'react'
import {
  DndContext,
  closestCenter,
  useSensor,
  useSensors,
  PointerSensor,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { restrictToVerticalAxis } from '@dnd-kit/modifiers'
import { CSS } from '@dnd-kit/utilities'
import React from 'react'

// ---------------- Types ----------------
export interface Category {
  id: string
  title: string
  parentId?: string | null
  order: number
  children?: Category[]
}

// ---------------- Build hierarchical tree ----------------
const buildTree = (categories: Category[]): Category[] => {
  const map: Record<string, Category & { children: Category[] }> = {}
  const roots: (Category & { children: Category[] })[] = []

  categories.forEach(c => (map[c.id] = { ...c, children: [] }))
  categories.forEach(c => {
    if (c.parentId && map[c.parentId]) {
      map[c.parentId].children.push(map[c.id])
    } else {
      roots.push(map[c.id])
    }
  })

  const sortTree = (nodes: Category[]) => {
    nodes.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    nodes.forEach(n => sortTree(n.children ?? []))
  }

  sortTree(roots)
  return roots
}

// ---------------- Sortable Item ----------------
interface SortableItemProps {
  id: string
  title: string
  selected: boolean
  onSelect: () => void
  level: number
  hasChildren: boolean
  isExpanded: boolean
  toggleExpand: () => void
}

const SortableItem: React.FC<SortableItemProps> = ({
  id, title, selected, onSelect, level, hasChildren, isExpanded, toggleExpand,
}) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      className={`${styles.item} ${selected ? styles.selected : ''}`}
      style={{
        transform: CSS.Transform.toString(transform),
        transition: transition || 'transform 150ms ease',
        userSelect: 'none',
      }}
    >
      <div className={styles.itemContent} style={{ marginLeft: level * 20 }}>
        {hasChildren && (
          <button
            type="button"
            onClick={e => { e.stopPropagation(); toggleExpand() }}
            className={styles.toggleBtn}
          >
            {isExpanded ? '▼' : '►'}
          </button>
        )}
        <span onClick={onSelect} className={styles.title}>{title}</span>
      </div>
      <div
        {...attributes}
        {...listeners}
        className={styles.dragHandle}
        style={{ touchAction: 'none', cursor: 'grab' }}
      >
        ⋮⋮
      </div>
    </div>
  )
}

// ---------------- Recursive Tree Renderer ----------------
const renderTree = (
  nodes: Category[],
  selectedId: string | null,
  onSelect: (id: string) => void,
  expanded: Record<string, boolean>,
  toggleExpand: (id: string) => void,
  level = 0
): React.ReactNode => {
  if (!nodes.length) return null

  return (
    <SortableContext items={nodes.map(n => n.id)} strategy={verticalListSortingStrategy}>
      {nodes.map(node => {
        const isExpanded = !!expanded[node.id]
        const hasChildren = (node.children?.length ?? 0) > 0
        return (
          <React.Fragment key={node.id}>
            <div className={styles.treeLineWrapper}>
              <SortableItem
                id={node.id}
                title={node.title}
                selected={selectedId === node.id}
                onSelect={() => onSelect(node.id)}
                level={level}
                hasChildren={hasChildren}
                isExpanded={isExpanded}
                toggleExpand={() => toggleExpand(node.id)}
              />
              {hasChildren && isExpanded && (
                <div className={styles.childBranch}>
                  {renderTree(node.children!, selectedId, onSelect, expanded, toggleExpand, level + 1)}
                </div>
              )}
            </div>
          </React.Fragment>
        )
      })}
    </SortableContext>
  )
}

// ---------------- Main Component ----------------
interface Props {
  categories: Category[]
}

export default function CategoriesPage({ categories: initialCategories }: Props) {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [inputTitle, setInputTitle] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 2 } })
  )

  const containerRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<HTMLDivElement>(null)
  const treeRef = useRef<HTMLDivElement>(null)

  const toggleExpand = (id: string) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  // Deselect when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !controlsRef.current?.contains(e.target as Node) &&
        !treeRef.current?.contains(e.target as Node)
      ) {
        setSelectedId(null)
      }
    }
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

  const fetchLatest = async () => {
    const data: Category[] = await fetch('/api/categories').then(r => r.json())
    setCategories(data)
  }

  const handleCreate = async () => {
    if (!inputTitle.trim()) return
    setIsProcessing(true)
    const parentId = selectedId || null
    await fetch('/api/categories/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: inputTitle, parentId }),
    })
    setInputTitle('')
    await fetchLatest()
    setIsProcessing(false)
  }

  const handleUpdate = async () => {
    if (!selectedId || !inputTitle.trim()) return
    await fetch('/api/categories/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selectedId, title: inputTitle }),
    })
    setInputTitle('')
    await fetchLatest()
  }

  const handleDelete = async () => {
    if (!selectedId) return
    await fetch('/api/categories/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selectedId }),
    })
    setSelectedId(null)
    await fetchLatest()
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const parentId = categories.find(c => c.id === active.id)?.parentId || null
    const siblings = categories.filter(c => (c.parentId ?? null) === parentId)
    const oldIndex = siblings.findIndex(c => c.id === active.id)
    const newIndex = siblings.findIndex(c => c.id === over.id)
    const reordered = arrayMove(siblings, oldIndex, newIndex)

    const newList = categories.map(c => {
      if ((c.parentId ?? null) === parentId) {
        return { ...c, order: reordered.findIndex(s => s.id === c.id) }
      }
      return c
    })

    setCategories(newList)

    await fetch('/api/categories/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parent: parentId,
        order: reordered.map((c, i) => ({ id: c.id, order: i })),
      }),
    })

    await fetchLatest()
  }

  const tree = useMemo(() => buildTree(categories), [categories])

  return (
    <>
      <AdminHeader title="Admin Panel" titleHref="/admin" />
      <div className={styles.container} ref={containerRef}>
        <h1 className={styles.pageTitle}>Categories</h1>
        {isProcessing && <div>Processing...</div>}

        <div className={styles.controls} ref={controlsRef}>
          <input
            placeholder={selectedId ? 'Edit or add subcategory' : 'Add new top-level category'}
            value={inputTitle}
            onChange={e => setInputTitle(e.target.value)}
          />
          <button onClick={handleCreate} disabled={isProcessing || !inputTitle.trim()}>Add</button>
          <button onClick={handleUpdate} disabled={isProcessing || !selectedId || !inputTitle.trim()}>Update</button>
          <button onClick={handleDelete} disabled={isProcessing || !selectedId}>Delete</button>
        </div>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
          modifiers={[restrictToVerticalAxis]}
        >
          <div className={styles.treeWrapper} ref={treeRef}>
            {renderTree(tree, selectedId, setSelectedId, expanded, toggleExpand)}
          </div>
        </DndContext>
      </div>
    </>
  )
}

// ---------------- SSR ----------------
import { GetServerSideProps } from "next"
import { prisma } from "../../lib/prisma"

export const getServerSideProps: GetServerSideProps = async () => {
  const categories: Category[] = await prisma.category.findMany({
    orderBy: { order: "asc" }
  })
  return { props: { categories } }
}
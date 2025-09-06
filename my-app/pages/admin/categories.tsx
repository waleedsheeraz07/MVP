'use client'
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import Layout from "../../components/header";
import { useState, useMemo, useEffect, useRef } from 'react'
import styles from '../../styles/admincat.module.css'
import { GetServerSideProps } from "next"
import { prisma } from "../../lib/prisma"
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
const buildTree = (categories: Category[] = []): Category[] => {
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

// ---------------- Recursive get all descendants ----------------
const getDescendants = (categories: Category[], parentId: string): string[] => {
  const children = categories.filter(c => c.parentId === parentId)
  return children.reduce<string[]>((acc, c) => {
    return [...acc, c.id, ...getDescendants(categories, c.id)]
  }, [])
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
          <button type="button" onClick={e => { e.stopPropagation(); toggleExpand() }} className={styles.toggleBtn}>
            {isExpanded ? '▼' : '►'}
          </button>
        )}
        <span onClick={onSelect} className={styles.title}>{title}</span>
      </div>
      <div {...attributes} {...listeners} className={styles.dragHandle} style={{ touchAction: 'none', cursor: 'grab' }}>
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
interface User {
  id: string;
  name?: string | null;
  role: string;
}

interface Props {
  categories: Category[];
  user: User;
}


export default function CategoriesPage({ categories: initialCategories, user}: Props) {
  const [categories, setCategories] = useState<Category[]>(initialCategories || [])
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

  // ---------------- Optimistic CRUD ----------------
  /*const handleCreate = async () => {
    if (!inputTitle.trim()) return
    setIsProcessing(true)
    const parentId = selectedId || null
    const tempId = 'temp-' + Math.random().toString(36).substring(2)

    setCategories(prev => [
      ...prev,
      { id: tempId, title: inputTitle, parentId, order: prev.filter(c => c.parentId === parentId).length }
    ])
    setInputTitle('')

    try {
      const res = await fetch('/api/categories/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: inputTitle, parentId }),
      })
      const newCategory: Category = await res.json()
      setCategories(prev => prev.map(c => c.id === tempId ? newCategory : c))
    } finally {
      setIsProcessing(false)
    }
  }*/

const handleCreate = async () => {
  if (!inputTitle.trim()) return
  setIsProcessing(true)
  const parentId = selectedId || null

  // Compute the new order based on siblings
  const siblings = categories.filter(c => (c.parentId ?? null) === parentId)
  const newOrder = siblings.length

  // Optimistic ID
  const tempId = 'temp-' + Math.random().toString(36).substring(2)

  // Optimistic UI update
  setCategories(prev => [
    ...prev,
    { id: tempId, title: inputTitle, parentId, order: newOrder }
  ])
  setInputTitle('')

  try {
    const res = await fetch('/api/categories/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: inputTitle, parentId, order: newOrder }),
    })
    const newCategory: Category = await res.json()

    // Replace temp category with actual response
    setCategories(prev => prev.map(c => c.id === tempId ? newCategory : c))
  } finally {
    setIsProcessing(false)
  }
}

  const handleUpdate = async () => {
    if (!selectedId || !inputTitle.trim()) return

    setCategories(prev => prev.map(c => c.id === selectedId ? { ...c, title: inputTitle } : c))
    setInputTitle('')

    await fetch('/api/categories/update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selectedId, title: inputTitle }),
    })
  }

  const handleDelete = async () => {
    if (!selectedId) return

    // Remove selected + descendants
    const descendants = getDescendants(categories, selectedId)
    setCategories(prev => prev.filter(c => c.id !== selectedId && !descendants.includes(c.id)))
    setSelectedId(null)

    await fetch('/api/categories/delete', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: selectedId }),
    })
  }

  // ---------------- Smooth Drag ----------------
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const activeCategory = categories.find(c => c.id === active.id)
    const overCategory = categories.find(c => c.id === over.id)
    if (!activeCategory || !overCategory) return

    // Only reorder among same parent
    const parentId = activeCategory.parentId || null
    if ((overCategory.parentId || null) !== parentId) return

    const siblings = categories.filter(c => (c.parentId ?? null) === parentId)
    const oldIndex = siblings.findIndex(c => c.id === active.id)
    const newIndex = siblings.findIndex(c => c.id === over.id)
    const reordered = arrayMove(siblings, oldIndex, newIndex)

    setCategories(prev => prev.map(c => {
      if ((c.parentId ?? null) === parentId) {
        return { ...c, order: reordered.findIndex(s => s.id === c.id) }
      }
      return c
    }))

    fetch('/api/categories/reorder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parent: parentId,
        order: reordered.map((c, i) => ({ id: c.id, order: i })),
      }),
    }).catch(console.error)
  }

  const tree = useMemo(() => buildTree(categories), [categories])

  return (
    <>
<Layout categories={categories} user={user}>
 
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
</Layout>
    </>
  )
}

// ---------------- SSR ----------------
export const getServerSideProps: GetServerSideProps = async (context: GetServerSidePropsContext) => {
const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) return { redirect: { destination: "/login", permanent: false } };
  if (session.user.role !== "ADMIN")
    return { redirect: { destination: "/", permanent: false } };

  const categories: Category[] = (await prisma.category.findMany({
    orderBy: { order: "asc" }
  })) || []

  return { props: { categories,
 user: {
        id: session.user.id,
        name: session.user.name || "Guest",
        role: session.user.role,
      },
} }
}
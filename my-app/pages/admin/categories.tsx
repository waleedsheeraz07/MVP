// pages/admin/categories.tsx:
'use client'
import Head from 'next/head'
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import Layout from "../../components/header";
import CustomModal from "../../components/CustomModal";
import { useState, useMemo, useEffect, useRef } from 'react'
import { GetServerSideProps } from "next"
import { GetServerSidePropsContext } from "next";
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

interface User {
  id: string;
  name?: string | null;
  role: string;
}

interface Props {
  categories: Category[];
  user: User;
}

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: (() => void) | null;
  type: 'danger' | 'warning' | 'success' | 'info';
  confirmText?: string;
  cancelText?: string;
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

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || 'transform 150ms ease',
    userSelect: 'none' as const,
  }

  return (
    <div
      ref={setNodeRef}
      className={`group flex items-center justify-between p-3 sm:p-4 mb-2 rounded-xl border-2 transition-all duration-300 ${
        selected 
          ? 'border-[#8b4513] bg-[#fdf8f3] shadow-lg scale-105' 
          : 'border-[#e6d9c6] bg-white hover:border-[#d4b996] hover:shadow-md'
      }`}
      style={style}
    >
      <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0" style={{ marginLeft: level * 16 }}>
        {hasChildren && (
          <button 
            type="button" 
            onClick={e => { e.stopPropagation(); toggleExpand() }} 
            className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 flex items-center justify-center text-[#8b4513] hover:bg-[#e6d9c6] rounded-lg transition-colors duration-200 text-xs sm:text-sm"
          >
            {isExpanded ? '▼' : '►'}
          </button>
        )}
        {!hasChildren && <div className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />}
        <span 
          onClick={onSelect} 
          className={`text-sm sm:text-lg font-medium cursor-pointer transition-colors duration-200 truncate flex-1 min-w-0 ${
            selected ? 'text-[#8b4513]' : 'text-[#3e2f25] hover:text-[#8b4513]'
          }`}
          title={title}
        >
          {title}
        </span>
      </div>
      <div 
        {...attributes} 
        {...listeners} 
        className="text-[#8b4513] opacity-0 group-hover:opacity-100 cursor-grab px-2 sm:px-3 py-1 rounded-lg hover:bg-[#f8efe4] transition-all duration-300 flex-shrink-0 text-sm sm:text-base"
        style={{ touchAction: 'none' }}
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
            <div className="relative">
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
                <div className="ml-4 sm:ml-8 border-l-2 border-[#e6d9c6] pl-2 sm:pl-4">
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
export default function CategoriesPage({ categories: initialCategories, user}: Props) {
  const [categories, setCategories] = useState<Category[]>(initialCategories || [])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [inputTitle, setInputTitle] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [expanded, setExpanded] = useState<Record<string, boolean>>({})
  const [error, setError] = useState('')

  // Modal state
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'warning'
  })

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 2 } })
  )

  const containerRef = useRef<HTMLDivElement>(null)
  const controlsRef = useRef<HTMLDivElement>(null)
  const treeRef = useRef<HTMLDivElement>(null)

  const toggleExpand = (id: string) =>
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }))

  // Modal handlers
  const showModal = (
    title: string, 
    message: string, 
    onConfirm: () => void, 
    type: 'danger' | 'warning' | 'success' | 'info' = 'warning',
    confirmText?: string,
    cancelText?: string
  ) => {
    setModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      type,
      confirmText,
      cancelText
    });
  };

  const closeModal = () => {
    setModal({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: null,
      type: 'warning'
    });
  };

  const handleModalConfirm = () => {
    if (modal.onConfirm) {
      modal.onConfirm();
    }
    closeModal();
  };

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

  const handleCreate = async () => {
    if (!inputTitle.trim()) {
      setError('Please enter a category title');
      return;
    }
    
    setIsProcessing(true);
    setError('');
    const parentId = selectedId || null;

    // Compute the new order based on siblings
    const siblings = categories.filter(c => (c.parentId ?? null) === parentId);
    const newOrder = siblings.length;

    // Optimistic ID
    const tempId = 'temp-' + Math.random().toString(36).substring(2);

    // Optimistic UI update
    setCategories(prev => [
      ...prev,
      { id: tempId, title: inputTitle.trim(), parentId, order: newOrder }
    ]);
    setInputTitle('');

    try {
      const res = await fetch('/api/categories/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: inputTitle.trim(), parentId, order: newOrder }),
      });
      
      if (!res.ok) throw new Error('Failed to create category');
      
      const newCategory: Category = await res.json();

      // Replace temp category with actual response
      setCategories(prev => prev.map(c => c.id === tempId ? newCategory : c));
    } catch (err) {
      setError('Failed to create category');
      // Revert optimistic update
      setCategories(prev => prev.filter(c => c.id !== tempId));
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedId || !inputTitle.trim()) {
      setError('Please select a category and enter a new title');
      return;
    }

    showModal(
      "Update Category",
      `Are you sure you want to rename this category to "${inputTitle.trim()}"?`,
      async () => {
        setIsProcessing(true);
        setError('');

        // Optimistic update
        setCategories(prev => prev.map(c => c.id === selectedId ? { ...c, title: inputTitle.trim() } : c));
        setInputTitle('');

        try {
          const res = await fetch('/api/categories/update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: selectedId, title: inputTitle.trim() }),
          });
          
          if (!res.ok) throw new Error('Failed to update category');
        } catch (err) {
          setError('Failed to update category');
          // Revert optimistic update
          setCategories(prev => prev.map(c => c.id === selectedId ? { ...c, title: categories.find(cat => cat.id === selectedId)?.title || '' } : c));
        } finally {
          setIsProcessing(false);
        }
      },
      'info',
      'Update',
      'Cancel'
    );
  };

  const handleDelete = async () => {
    if (!selectedId) return;

    const selectedCategory = categories.find(c => c.id === selectedId);
    if (!selectedCategory) return;

    const descendants = getDescendants(categories, selectedId);
    const totalToDelete = 1 + descendants.length;

    showModal(
      "Delete Category",
      `Are you sure you want to delete "${selectedCategory.title}" and its ${descendants.length > 0 ? `${descendants.length} subcategor${descendants.length === 1 ? 'y' : 'ies'}` : 'category'}? This action cannot be undone.`,
      async () => {
        setIsProcessing(true);
        setError('');

        // Remove selected + descendants
        setCategories(prev => prev.filter(c => c.id !== selectedId && !descendants.includes(c.id)));
        setSelectedId(null);

        try {
          const res = await fetch('/api/categories/delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: selectedId }),
          });
          
          if (!res.ok) throw new Error('Failed to delete category');
        } catch (err) {
          setError('Failed to delete category');
          // In case of error, we would need to refetch the categories
          // For now, we'll just show an error message
        } finally {
          setIsProcessing(false);
        }
      },
      'danger',
      'Delete',
      'Cancel'
    );
  };

  // ---------------- Smooth Drag ----------------
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeCategory = categories.find(c => c.id === active.id);
    const overCategory = categories.find(c => c.id === over.id);
    if (!activeCategory || !overCategory) return;

    // Only reorder among same parent
    const parentId = activeCategory.parentId || null;
    if ((overCategory.parentId || null) !== parentId) return;

    const siblings = categories.filter(c => (c.parentId ?? null) === parentId);
    const oldIndex = siblings.findIndex(c => c.id === active.id);
    const newIndex = siblings.findIndex(c => c.id === over.id);
    const reordered = arrayMove(siblings, oldIndex, newIndex);

    setCategories(prev => prev.map(c => {
      if ((c.parentId ?? null) === parentId) {
        return { ...c, order: reordered.findIndex(s => s.id === c.id) };
      }
      return c;
    }));

    try {
      await fetch('/api/categories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent: parentId,
          order: reordered.map((c, i) => ({ id: c.id, order: i })),
        }),
      });
    } catch (err) {
      console.error('Failed to reorder categories:', err);
    }
  };

  const tree = useMemo(() => buildTree(categories), [categories]);
  const selectedCategory = categories.find(c => c.id === selectedId);

  return (
    <>
      <Head>
        <title>Manage Categories | Vintage Marketplace</title>
        <meta name="description" content="Organize product categories for easier browsing and selling." />
      </Head>
      
      {/* Custom Modal */}
      <CustomModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        onConfirm={handleModalConfirm}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
      />
      
      <Layout categories={categories} user={user}>
        <div className="min-h-screen bg-[#fefaf5] py-4 sm:py-8 px-3 sm:px-6">
          <div className="max-w-4xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-6 sm:mb-12">
              <h1 className="text-2xl sm:text-4xl font-bold text-[#3e2f25] mb-3 sm:mb-4">
                Manage Categories
              </h1>
              <p className="text-sm sm:text-lg text-[#5a4436] max-w-2xl mx-auto px-2">
                Organize your product categories for better navigation and user experience
              </p>
            </div>

            {/* Main Content Container */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 mb-4 sm:mb-6" ref={containerRef}>
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 p-3 sm:p-4 rounded-lg sm:rounded-xl mb-4 sm:mb-6 text-center text-sm sm:text-base">
                  {error}
                </div>
              )}

              {/* Controls Section */}
              <div className="mb-6 sm:mb-8" ref={controlsRef}>
                <div className="flex flex-col gap-4">
                  <div className="flex-1">
                    <label className="block text-sm font-semibold text-[#3e2f25] mb-2 sm:mb-3">
                      {selectedId ? 'Edit Category or Add Subcategory' : 'Add New Top-Level Category'}
                    </label>
                    <input
                      type="text"
                      placeholder={selectedId ? 'Enter new category name...' : 'Enter top-level category name...'}
                      value={inputTitle}
                      onChange={e => setInputTitle(e.target.value)}
                      className="w-full px-3 sm:px-4 py-2 sm:py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-lg sm:rounded-xl text-[#3e2f25] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300 text-sm sm:text-base"
                    />
                  </div>
                  
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                    <button 
                      onClick={handleCreate} 
                      disabled={isProcessing || !inputTitle.trim()}
                      className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-[#8b4513] text-white rounded-lg sm:rounded-xl font-semibold hover:bg-[#6b3410] transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base"
                    >
                      {isProcessing ? (
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Adding...</span>
                        </div>
                      ) : (
                        'Add Category'
                      )}
                    </button>
                    
                    <button 
                      onClick={handleUpdate} 
                      disabled={isProcessing || !selectedId || !inputTitle.trim()}
                      className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-blue-600 text-white rounded-lg sm:rounded-xl font-semibold hover:bg-blue-700 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base"
                    >
                      Update
                    </button>
                    
                    <button 
                      onClick={handleDelete} 
                      disabled={isProcessing || !selectedId}
                      className="flex-1 px-4 sm:px-6 py-2 sm:py-3 bg-red-600 text-white rounded-lg sm:rounded-xl font-semibold hover:bg-red-700 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {selectedCategory && (
                  <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-[#fdf8f3] border border-[#e6d9c6] rounded-lg sm:rounded-xl">
                    <p className="text-xs sm:text-sm text-[#5a4436]">
                      <span className="font-semibold">Selected:</span> {selectedCategory.title}
                      {selectedCategory.parentId && (
                        <span className="text-[#8b4513] ml-1 sm:ml-2">
                          (Subcategory)
                        </span>
                      )}
                    </p>
                  </div>
                )}
              </div>

              {/* Categories Tree */}
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-[#3e2f25] mb-3 sm:mb-4">
                  Category Structure
                </h3>
                <div className="bg-[#fdf8f3] border border-[#e6d9c6] rounded-lg sm:rounded-xl p-4 sm:p-6 min-h-[300px] sm:min-h-[400px]" ref={treeRef}>
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                    modifiers={[restrictToVerticalAxis]}
                  >
                    {tree.length > 0 ? (
                      renderTree(tree, selectedId, setSelectedId, expanded, toggleExpand)
                    ) : (
                      <div className="text-center py-8 sm:py-16">
                        <div className="w-16 h-16 sm:w-24 sm:h-24 mx-auto mb-4 sm:mb-6 bg-[#e6d9c6] rounded-full flex items-center justify-center">
                          <svg className="w-8 h-8 sm:w-12 sm:h-12 text-[#8b4513]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-[#3e2f25] mb-2">No categories yet</h3>
                        <p className="text-[#5a4436] text-sm sm:text-base">Start by adding your first category above</p>
                      </div>
                    )}
                  </DndContext>
                </div>
              </div>

              {/* Instructions */}
              <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-[#f8efe4] border border-[#e6d9c6] rounded-lg sm:rounded-xl">
                <h4 className="font-semibold text-[#3e2f25] mb-2 text-sm sm:text-base">How to manage categories:</h4>
                <ul className="text-xs sm:text-sm text-[#5a4436] space-y-1">
                  <li>• Click on a category to select it</li>
                  <li>• Drag and drop categories to reorder them</li>
                  <li>• Use the toggle buttons (►/▼) to expand/collapse subcategories</li>
                  <li>• Select a category to add subcategories or edit/delete it</li>
                </ul>
              </div>
            </div>

            {/* Summary */}
            <div className="text-center">
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 inline-block">
                <p className="text-sm sm:text-lg text-[#3e2f25]">
                  Total Categories: <span className="font-bold text-[#8b4513]">{categories.length}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
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

  return { 
    props: { 
      categories,
      user: {
        id: session.user.id,
        name: session.user.name || "Guest",
        role: session.user.role,
      },
    } 
  }
}
"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/router"
import { GetServerSidePropsContext } from "next"
import { getServerSession } from "next-auth/next"
import { authOptions } from "./api/auth/[...nextauth]"
import prisma from "../lib/prisma" // adjust path

// --- SERVER SIDE FETCH ---
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session) {
    return { redirect: { destination: "/login", permanent: false } }
  }

  // fetch categories with parent for tree building
  const categories = await prisma.category.findMany({
    select: { id: true, title: true, order: true, parentId: true },
    orderBy: { order: "asc" },
  })

  // map to frontend format
  const mapped = categories.map(cat => ({
    _id: cat.id,
    title: cat.title,
    order: cat.order,
    parent: cat.parentId ? { _id: cat.parentId, title: "" } : undefined,
  }))

  return { props: { session, categories: mapped } }
}

// --- TYPES ---
interface CategoryRaw {
  _id: string
  title: string
  parent?: { _id: string; title: string }
  order?: number
}
interface CategoryNode extends CategoryRaw {
  children: CategoryNode[]
}

interface SellProductPageProps {
  categories: CategoryRaw[]
}

export default function SellProductPage({ categories }: SellProductPageProps) {
  const router = useRouter()

  // FORM STATES
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [price, setPrice] = useState("")
  const [quantity, setQuantity] = useState("")
  const [images, setImages] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [colors, setColors] = useState("")
  const [sizes, setSizes] = useState("")
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [condition, setCondition] = useState("")
  const [era, setEra] = useState("")
  const [before1900, setBefore1900] = useState("")

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  // IMAGE HANDLERS
  const handleImageChange = (files: FileList | null) => {
    if (!files) return
    const fileArray = Array.from(files)
    setImages(prev => {
      const updated = [...prev, ...fileArray]
      setPreviews(updated.map(f => URL.createObjectURL(f)))
      return updated
    })
  }

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  // CATEGORY TREE BUILD
  const buildCategoryTree = (cats: CategoryRaw[]): CategoryNode[] => {
    const map: Record<string, CategoryNode> = {}
    const roots: CategoryNode[] = []

    cats.forEach(cat => {
      map[cat._id] = { ...cat, children: [] }
    })

    cats.forEach(cat => {
      if (cat.parent?._id && map[cat.parent._id]) {
        map[cat.parent._id].children.push(map[cat._id])
      } else {
        roots.push(map[cat._id])
      }
    })

    const sortTree = (nodes: CategoryNode[]) => {
      nodes.sort((a, b) => (a.order || 0) - (b.order || 0))
      nodes.forEach(n => sortTree(n.children))
    }

    sortTree(roots)
    return roots
  }

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories])

  const toggleCategoryExpand = (id: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleCategoryToggle = (id: string) => {
    setSelectedCategories(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    )
  }

  const CategoryNodeItem: React.FC<{ node: CategoryNode }> = ({ node }) => {
    const isExpanded = expandedCategories.has(node._id)

    return (
      <div>
        <div className="flex items-center gap-2 mb-1">
          {node.children.length > 0 && (
            <button
              type="button"
              onClick={() => toggleCategoryExpand(node._id)}
              className="text-sm"
            >
              {isExpanded ? "▾" : "▸"}
            </button>
          )}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={selectedCategories.includes(node._id)}
              onChange={() => handleCategoryToggle(node._id)}
            />
            {node.title}
          </label>
        </div>
        {isExpanded && node.children.length > 0 && (
          <div className="ml-6">
            {node.children.map(child => (
              <CategoryNodeItem key={child._id} node={child} />
            ))}
          </div>
        )}
      </div>
    )
  }

  // SUBMIT
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const formData = new FormData()
      formData.append("title", title)
      formData.append("description", description)
      formData.append("price", price)
      formData.append("quantity", quantity)
      formData.append("colors", colors)
      formData.append("sizes", sizes)
      formData.append("categories", JSON.stringify(selectedCategories))
      formData.append("condition", condition)
      formData.append("era", era === "before1900" ? before1900 : era)

      images.forEach(file => formData.append("images", file))

      const res = await fetch("/api/products/create", {
        method: "POST",
        body: formData,
      })

      const data = await res.json()
      if (!res.ok) throw data

      router.push("/myproducts")
    } catch (err: unknown) {
      if (err && typeof err === "object" && "error" in err) {
        setError((err as { error?: string }).error || "Something went wrong")
      } else {
        setError("Something went wrong")
      }
    } finally {
      setLoading(false)
    }
  }

  // --- ERA OPTIONS ---
  const eraOptions = [
    "1900–1909",
    "1910–1919",
    "1920–1929",
    "1930–1939",
    "1940–1949",
    "1950–1959",
    "1960–1969",
    "1970–1979",
    "1980–1989",
    "1990–1999",
    "2000–2009",
    "2010–2019",
    "2020–2025",
    "before1900",
  ]

  return (
    <div className="min-h-screen flex justify-center items-center bg-[#fdf8f3] p-4">
      <div className="w-full max-w-2xl bg-[#fffdfb] p-8 rounded-2xl shadow-lg">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">
          Sell a Product
        </h1>

        {error && (
          <p className="bg-[#ffe5e5] text-red-700 p-3 rounded mb-4 text-center">
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Title *"
            value={title}
            onChange={e => setTitle(e.target.value)}
            required
            className="input"
          />

          <textarea
            placeholder="Description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            className="input min-h-[100px]"
          />

          <div className="flex gap-4 flex-wrap">
            <input
              type="number"
              placeholder="Price *"
              value={price}
              onChange={e => setPrice(e.target.value)}
              required
              className="input flex-1"
            />
            <input
              type="number"
              placeholder="Quantity *"
              value={quantity}
              onChange={e => setQuantity(e.target.value)}
              required
              className="input flex-1"
            />
          </div>

          {/* Categories */}
          <div>
            <h3 className="mb-2 font-medium">Categories *</h3>
            <div className="border p-3 rounded-lg max-h-64 overflow-y-auto bg-[#fffaf5]">
              {categoryTree.map(node => (
                <CategoryNodeItem key={node._id} node={node} />
              ))}
            </div>
          </div>

          {/* Condition */}
          <select
            value={condition}
            onChange={e => setCondition(e.target.value)}
            required
            className="input"
          >
            <option value="">Select Condition *</option>
            {["Good", "Excellent", "Untouched", "Bad", "Broken", "Torn"].map(c => (
              <option key={c} value={c.toLowerCase()}>
                {c}
              </option>
            ))}
          </select>

          {/* Era */}
          <div>
            <select
              value={era}
              onChange={e => setEra(e.target.value)}
              required
              className="input"
            >
              <option value="">Select Era *</option>
              {eraOptions.map(opt => (
                <option key={opt} value={opt}>
                  {opt === "before1900" ? "Before 1900" : opt}
                </option>
              ))}
            </select>
            {era === "before1900" && (
              <input
                type="number"
                placeholder="Enter Year (before 1900)"
                value={before1900}
                onChange={e => setBefore1900(e.target.value)}
                className="input mt-2"
              />
            )}
          </div>

          {/* Image Upload */}
          <div>
            <h3 className="mb-2 font-medium">Images</h3>
            <label className="block w-full p-3 border border-dashed border-[#d4b996] rounded-lg text-center cursor-pointer bg-[#fffaf5] text-[#3e2f25] hover:bg-[#f8efe4] transition">
              Upload Images
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={e => handleImageChange(e.target.files)}
                className="hidden"
              />
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {previews.map((url, idx) => (
                <div key={idx} className="relative">
                  <img
                    src={url}
                    alt={`Preview ${idx}`}
                    className="w-24 h-24 object-cover rounded-lg border"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(idx)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <input
            type="text"
            placeholder="Colors (comma separated)"
            value={colors}
            onChange={e => setColors(e.target.value)}
            className="input"
          />

          <input
            type="text"
            placeholder="Sizes (comma separated)"
            value={sizes}
            onChange={e => setSizes(e.target.value)}
            className="input"
          />

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-3 bg-[#3e2f25] text-[#fdf8f3] rounded-lg hover:bg-[#5a4436] transition"
          >
            {loading ? "Saving..." : "Create Product"}
          </button>
        </form>
      </div>

      <style jsx>{`
        .input {
          padding: 0.75rem;
          border-radius: 0.75rem;
          border: 1px solid #ccc;
          width: 100%;
          background-color: #fff;
          color: #000;
        }
      `}</style>
    </div>
  )
}
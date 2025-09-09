// pages/seller/products/[id].tsx:
"use client"

import Head from 'next/head'
import { useState, useMemo } from "react"
import { useRouter } from "next/router"
import { GetServerSidePropsContext } from "next"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../../api/auth/[...nextauth]"
import { prisma } from "../../../lib/prisma" // adjust path
import Layout from "../../../components/header";

// --- SERVER SIDE FETCH ---
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions)

  if (!session) {
    return { redirect: { destination: "/login", permanent: false } }
  }

  const { id } = context.query
  if (!id || typeof id !== "string") return { notFound: true }

  // fetch categories for tree
  const categories = await prisma.category.findMany({
    select: { id: true, title: true, order: true, parentId: true },
    orderBy: { order: "asc" },
  })

  const mappedCategories = categories.map(cat => ({
    _id: cat.id,
    title: cat.title,
    order: cat.order,
    parent: cat.parentId ? { _id: cat.parentId, title: "" } : undefined,
  }))

  // fetch product with categories
  const productData = await prisma.product.findUnique({
    where: { id },
    include: {
      categories: { select: { categoryId: true } },
    },
  })

  if (!productData) return { notFound: true }

  return {
    props: {
      session,
      categories: mappedCategories,
      categories2: categories,
      product: {
        id: productData.id,
        title: productData.title,
        description: productData.description || "",
        price: productData.price,
        quantity: productData.quantity,
        colors: productData.colors || [],
        sizes: productData.sizes || [],
        condition: productData.condition,
        era: productData.era,
        images: productData.images || [],
        categories: productData.categories,
      },
    user: { id: session.user.id, name: session.user.name || "Guest", role: session.user.role },
    },
  }
}


interface User {
  id: string;
  name?: string | null;
  role: string;
}

// --- TYPES ---
interface CategoryRaw {
  _id: string
  title: string
  parent?: { _id: string; title: string }
  order?: number
}

interface Category {
  id: string;
  title: string;
  order: number;
  parentId?: string | null;
}

interface CategoryNode extends CategoryRaw {
  children: CategoryNode[]
}

interface ProductCategory {
  categoryId: string
}

interface Product {
  id: string
  title: string
  description: string
  price: number
  quantity: number
  colors: string[]
  sizes: string[]
  condition: string
  era: string
  images: string[]
  categories: ProductCategory[]
}

interface EditProductPageProps {
  categories: CategoryRaw[]
  categories2: Category[]
  product: Product
  user: User
}

// --- REUSABLE CONFIRM MODAL ---
interface ConfirmModalProps {
  message: string
  onConfirm: () => void | Promise<void>
  onCancel: () => void
}
const ConfirmModal = ({ message, onConfirm, onCancel }: ConfirmModalProps) => (
  <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
    <div className="bg-white p-6 rounded-xl shadow-lg w-96 text-center">
      <p className="mb-4">{message}</p>
      <div className="flex justify-around gap-4">
        <button
          onClick={onConfirm}
          className="px-4 py-2 bg-[#3e2f25] text-[#fdf8f3] rounded-lg"
        >
          Yes
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2 bg-gray-300 rounded-lg"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)

export default function EditProductPage({ categories, categories2, product, user }: EditProductPageProps) {
  const router = useRouter()

  // --- STATES ---
  const [title, setTitle] = useState(product.title)
  const [description, setDescription] = useState(product.description)
  const [price, setPrice] = useState(product.price.toString())
  const [quantity, setQuantity] = useState(product.quantity.toString())
  const [colors, setColors] = useState(product.colors.join(", "))
  const [sizes, setSizes] = useState(product.sizes.join(", "))
  const [condition, setCondition] = useState(product.condition)
  const [era, setEra] = useState(product.era)
  const [before1900, setBefore1900] = useState("")

  const [selectedCategories, setSelectedCategories] = useState(
    product.categories.map(c => c.categoryId)
  )

  const [images, setImages] = useState<File[]>([])
  const [existingImages, setExistingImages] = useState<string[]>(product.images)
  const [previews, setPreviews] = useState<string[]>(product.images)

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  
// --- MODAL STATE ---
const [modal, setModal] = useState<{ type: "update" | "delete"; open: boolean }>({
  type: "update",
  open: false,
}
)

  // --- IMAGE HANDLERS ---
  const handleImageChange = (files: FileList | null) => {
    if (!files) return
    const fileArray = Array.from(files)
    setImages(prev => {
      const updated = [...prev, ...fileArray]
      setPreviews([...existingImages, ...updated.map(f => URL.createObjectURL(f))])
      return updated
    })
  }

  const removeImage = (index: number) => {
    if (index < existingImages.length) {
      setExistingImages(prev => prev.filter((_, i) => i !== index))
    } else {
      const newIndex = index - existingImages.length
      setImages(prev => prev.filter((_, i) => i !== newIndex))
    }
    setPreviews(prev => prev.filter((_, i) => i !== index))
  }

  // --- CATEGORY TREE ---
  const buildCategoryTree = (cats: CategoryRaw[]): CategoryNode[] => {
    const map: Record<string, CategoryNode> = {}
    const roots: CategoryNode[] = []

    cats.forEach(cat => (map[cat._id] = { ...cat, children: [] }))
    cats.forEach(cat => {
      if (cat.parent?._id && map[cat.parent._id]) map[cat.parent._id].children.push(map[cat._id])
      else roots.push(map[cat._id])
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
            <button type="button" onClick={() => toggleCategoryExpand(node._id)}>
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

// --- FORM HANDLER (for form submit) ---
const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
  if (e) e.preventDefault()
  setLoading(true)
  setError("")

if (sizes.length === 0 || !condition) {
  if (sizes.length === 0) setError("Please select at least one size.");
  else if (!condition) setError("Please select a condition.");

  setLoading(false);
  return;
}

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
    formData.append("existingImages", JSON.stringify(existingImages))

    images.forEach(file => formData.append("images", file))

    const res = await fetch(`/api/products/update?id=${product.id}`, {
      method: "POST",
      body: formData,
    })

    const data = await res.json()
    if (!res.ok) throw data

    router.push("/seller/products")
  } catch (err: unknown) {
    const e = err as { error?: string }
    setError(e.error || "Something went wrong")
  } finally {
    setLoading(false)
    setModal(prev => ({ ...prev, open: false }))
  }
}

// --- DELETE HANDLER ---
const deleteProduct = async () => {
  setLoading(true)
  setError("")

  try {
    // Using FormData just for consistency (optional)
    const formData = new FormData()
    formData.append("productId", product.id)

    const res = await fetch("/api/products/delete?" + new URLSearchParams({ productId: product.id }), {
      method: "DELETE",
    })

    const data = await res.json()
    if (!res.ok) throw data

    router.push("/seller/products")
  } catch (err: unknown) {
    if (err && typeof err === "object" && "error" in err) {
      setError((err as { error?: string }).error || "Delete failed")
    } else if (err instanceof Error) {
      setError(err.message || "Delete failed")
    } else {
      setError("Delete failed")
    }
  } finally {
    setLoading(false)
    setModal(prev => ({ ...prev, open: false }))
  }
}


const eraOptions = [
    "before1900","1900–1909","1910–1919","1920–1929","1930–1939",
    "1940–1949","1950–1959","1960–1969","1970–1979","1980–1989",
    "1990–1999","2000–2009","2010–2019","2020–2025"
  ]

  return (
<>
<Head>
  <title>Edit Product | Vintage Marketplace</title>
  <meta name="description" content="Update details, images, and pricing for your listed vintage product." />
</Head>
<Layout categories={categories2} user={user}>
    <div className="min-h-screen flex justify-center items-center bg-[#fdf8f3] p-4">
      <div className="w-full max-w-2xl bg-[#fffdfb] p-8 rounded-2xl shadow-lg">
        <h1 className="text-2xl md:text-3xl font-bold mb-6 text-center">
          Edit Product
        </h1>

        {error && <p className="bg-[#ffe5e5] text-red-700 p-3 rounded mb-4 text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input type="text" placeholder="Title *" value={title} onChange={e => setTitle(e.target.value)} required className="input" />
          <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} className="input min-h-[100px]" />

          <div className="flex gap-4 flex-wrap">
            <input type="number" placeholder="Price *" value={price} onChange={e => setPrice(e.target.value)} required className="input flex-1" />
            <input type="number" placeholder="Quantity *" value={quantity} onChange={e => setQuantity(e.target.value)} required className="input flex-1" />
          </div>

          {/* Category Tree */}
          <div>
            <h3 className="mb-2 font-medium">Categories *</h3>
            <div className="border p-3 rounded-lg max-h-64 overflow-y-auto bg-[#fffaf5]">
              {categoryTree.map(node => <CategoryNodeItem key={node._id} node={node} />)}
            </div>
          </div>

          {/* Condition */}
          <select value={condition} onChange={e => setCondition(e.target.value)} required className="input">
            <option value="">Select Condition *</option>
            {["Untouched","Excellent","Good","Fair","Slightly Damaged","Damaged","Highly Damaged"].map(c => <option key={c} value={c.toLowerCase()}>{c}</option>)}
          </select>

          {/* Era */}
          <div>
            <select value={era} onChange={e => setEra(e.target.value)} required className="input">
              <option value="">Select Era *</option>
              {eraOptions.map(opt => <option key={opt} value={opt}>{opt === "before1900" ? "Before 1900" : opt}</option>)}
            </select>
            {era === "before1900" && <input type="number" placeholder="Enter Year (before 1900)" value={before1900} onChange={e => setBefore1900(e.target.value)} className="input mt-2" />}
          </div>

          {/* Images */}
          <div>
            <h3 className="mb-2 font-medium">Images</h3>
            <label className="block w-full p-3 border border-dashed border-[#d4b996] rounded-lg text-center cursor-pointer bg-[#fffaf5] text-[#3e2f25] hover:bg-[#f8efe4] transition">
              Upload Images
              <input type="file" accept="image/*" multiple onChange={e => handleImageChange(e.target.files)} className="hidden" />
            </label>
            <div className="flex flex-wrap gap-2 mt-2">
              {previews.map((url, idx) => (
                <div key={idx} className="relative">
                  <img src={url} alt={`Preview ${idx}`} className="w-24 h-24 object-cover rounded-lg border" />
                  <button type="button" onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">×</button>
                </div>
              ))}
            </div>
          </div>

          <input type="text" placeholder="Colors (comma separated)" value={colors} onChange={e => setColors(e.target.value)} className="input" />
          
<div className="flex flex-col gap-2">
  <label className="text-gray-700 font-semibold">
    Available Sizes <span className="text-red-500">*</span>
  </label>

  <div className="flex flex-wrap gap-3">
    {["XXS", "XS", "S", "M", "L", "XL", "XXL"].map((size) => {
      // Normalize saved sizes string -> array of uppercase values
      const selectedArray = sizes
        ? sizes.split(",").map(s => s.trim().toUpperCase()).filter(Boolean)
        : [];

      const isSelected = selectedArray.includes(size);

      return (
        <button
          key={size}
          type="button"
          onClick={() => {
            let updated = [...selectedArray];
            if (isSelected) {
              updated = updated.filter(s => s !== size);
            } else {
              updated.push(size);
            }
            setSizes(updated.join(",")); // keep as comma-separated string
          }}
          className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-200
            ${isSelected ? "border-[#3e2f25] scale-110 shadow-md bg-[#fdf8f3]" : "border-gray-300 bg-white"}
            hover:scale-110 hover:shadow-md cursor-pointer
          `}
        >
          {size}
        </button>
      );
    })}
  </div>

  {/* Hidden field for form validation */}
  <input
    type="text"
    name="sizes"
    value={sizes}
    required
    readOnly
    hidden
  />
</div>

<div className="flex gap-4">
  <button
    type="submit"
    disabled={loading}
    className="px-4 py-3 bg-[#3e2f25] text-[#fdf8f3] rounded-lg hover:bg-[#5a4436] transition flex-1"
  >
    {loading ? "Saving..." : "Update Product"}
  </button>
  <button
    type="button"
    onClick={() => setModal({ type: "delete", open: true })}
    className="px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex-1"
  >
    Delete
  </button>
</div>
        </form>
      </div>



{modal.open && modal.type === "update" && (
  <ConfirmModal
    message="Are you sure you want to update this product?"
    onConfirm={() => handleSubmit()}  // ✅ wrapper, no event
    onCancel={() => setModal({ ...modal, open: false })}
  />
)}

{modal.open && modal.type === "delete" && (
  <ConfirmModal
    message="Are you sure you want to delete this product?"
    onConfirm={deleteProduct}
    onCancel={() => setModal({ ...modal, open: false })}
  />
)}

      <style jsx>{`
        .input { padding: 0.75rem; border-radius: 0.75rem; border: 1px solid #ccc; width: 100%; background-color: #fff; color: #000; }
      `}</style>
    </div>
</Layout>
</>
  )
}
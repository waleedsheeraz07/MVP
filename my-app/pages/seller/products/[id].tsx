// pages/seller/products/[id].tsx:
"use client"
import Link from "next/link"
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
  


// Determine initial era and before1900 input
let initialEra = product.era;
let initialBefore1900 = "";

if (product.era) {
  const match = product.era.match(/^(\d+)/); // get starting year
  const startYear = match ? parseInt(match[1], 10) : null;

  if (startYear && startYear < 1900) {
    initialEra = "before1900";
    initialBefore1900 = startYear.toString();
  }
}

// State
const [era, setEra] = useState(initialEra);
const [before1900, setBefore1900] = useState(initialBefore1900);



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

if (sizes.length === 0 || !condition || !era || (era === "before1900" && !before1900)) {
  if (sizes.length === 0) setError("Please select at least one size.");
  else if (!condition) setError("Please select a condition.");
  else if (!era || (era === "before1900" && !before1900)) setError("Please select an era.");

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
      <title>Edit Your Vintage Treasure | Vintage Marketplace</title>
      <meta name="description" content="Update details, images, and pricing for your listed vintage product." />
    </Head>
    
    <Layout categories={categories2} user={user}>
      <div className="min-h-screen bg-[#fefaf5] py-8 px-4 sm:px-6">
        {/* Back Button */}
        <Link
          href="/seller/products"
          className="inline-flex items-center space-x-2 text-[#8b4513] hover:text-[#6b3410] transition-colors duration-300 mb-6 group"
        >
          <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <span className="font-medium">Back to My Products</span>
        </Link>

        {/* Main Form Container */}
        <div className="max-w-2xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#3e2f25] mb-4">
              Edit Your Vintage Treasure
            </h1>
            <p className="text-lg text-[#5a4436] max-w-xl mx-auto">
              Update your listing details and keep your vintage collection current.
            </p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-[#3e2f25] mb-3">
                  Product Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Vintage 1950s Leather Jacket"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-semibold text-[#3e2f25] mb-3">
                  Description
                </label>
                <textarea
                  placeholder="Tell the story behind this piece... Where did you find it? What makes it special?"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300 resize-none"
                />
              </div>

              {/* Price & Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[#3e2f25] mb-3">
                    Price (KWD) *
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0.00"
                      value={price}
                      onChange={e => setPrice(e.target.value)}
                      required
                      min="0"
                      step="0.01"
                      className="w-full pl-15 pr-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
                    />
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#8b4513] font-medium">
                      KWD
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[#3e2f25] mb-3">
                    Quantity *
                  </label>
                  <input
                    type="number"
                    placeholder="1"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    required
                    min="0"
                    className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
                  />
                </div>
              </div>

              {/* Categories */}
              <div>
                <label className="block text-sm font-semibold text-[#3e2f25] mb-3">
                  Categories *
                </label>
                <div className="max-h-48 overflow-y-auto bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl p-4 space-y-2">
                  {categoryTree.map(node => (
                    <CategoryNodeItem key={node._id} node={node} />
                  ))}
                </div>
              </div>

              {/* Condition */}
              <div>
                <label className="block text-sm font-semibold text-[#3e2f25] mb-4">
                  Condition *
                </label>
                <div className="space-y-3">
                  {["Excellent", "Good", "Fair", "Slightly Damaged", "Highly Damaged"].map((cond) => {
                    const isCurrent = condition?.toLowerCase().trim() === cond.toLowerCase().trim();
                    return (
                      <button
                        type="button"
                        key={cond}
                        onClick={() => setCondition(cond.toLowerCase())}
                        className={`w-full px-4 py-3 rounded-xl text-left transition-all duration-300 cursor-pointer
                          ${isCurrent 
                            ? "bg-[#8b4513] text-white shadow-md transform scale-105" 
                            : "bg-[#fdf8f3] text-[#3e2f25] hover:bg-[#e6d9c6] hover:scale-105"
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{cond}</span>
                          {isCurrent && (
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                <input type="hidden" name="condition" value={condition} required />
              </div>

              {/* Era */}
              <div>
                <label className="block text-sm font-semibold text-[#3e2f25] mb-3">
                  Era *
                </label>
                <div className="flex flex-wrap gap-3">
                  {eraOptions.map(opt => {
                    const isSelected = era === opt;
                    const displayName = opt === "before1900" ? "Before 1900" : opt;

                    return (
                      <div key={opt} className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setEra(opt)}
                          className={`px-4 py-2 rounded-full border-2 font-semibold text-sm transition-all duration-300
                            ${isSelected 
                              ? "border-[#8b4513] scale-110 shadow-md bg-[#fdf8f3] text-[#8b4513]" 
                              : "border-gray-300 bg-white text-[#3e2f25] hover:scale-105"
                            } cursor-pointer
                          `}
                        >
                          {displayName}
                        </button>

                        {/* Year input only for Before 1900 */}
                        {opt === "before1900" && isSelected && (
                          <div className="relative">
                            <input
                              type="number"
                              placeholder="Enter year"
                              value={before1900}
                              onChange={e => setBefore1900(e.target.value)}
                              className="w-32 px-4 py-2 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
                              min="0"
                              max="1899"
                            />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <input type="text" name="era" value={era === "before1900" ? before1900 : era} hidden />
              </div>

              {/* Image Upload */}
              <div>
                <label className="block text-sm font-semibold text-[#3e2f25] mb-3">
                  Images
                </label>
                <label className="block w-full p-6 border-2 border-dashed border-[#d4b996] rounded-xl text-center cursor-pointer bg-[#fdf8f3] text-[#5a4436] hover:bg-[#f8efe4] hover:border-[#8b4513] transition-all duration-300 group">
                  <div className="flex flex-col items-center space-y-2">
                    <svg className="w-8 h-8 text-[#8b4513] group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium">Update Images</span>
                    <span className="text-sm text-[#9ca3af]">Add or replace images (PNG, JPG, WEBP)</span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={e => handleImageChange(e.target.files)}
                    className="hidden"
                  />
                </label>
                
                {/* Image Previews */}
                {previews.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-[#3e2f25] mb-3">Current Images</h4>
                    <div className="flex flex-wrap gap-3">
                      {previews.map((url, idx) => (
                        <div key={idx} className="relative group">
                          <img
                            src={url}
                            alt={`Preview ${idx + 1}`}
                            className="w-20 h-20 object-cover rounded-lg border-2 border-[#e6d9c6] group-hover:border-[#8b4513] transition-all duration-300"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:scale-110"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Colors */}
              <div>
                <label className="block text-sm font-semibold text-[#3e2f25] mb-3">
                  Colors
                </label>
                <input
                  type="text"
                  placeholder="e.g., Red, Blue, Green (comma separated)"
                  value={colors}
                  onChange={e => setColors(e.target.value)}
                  className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
                />
              </div>

              {/* Sizes */}
              <div>
                <label className="block text-sm font-semibold text-[#3e2f25] mb-3">
                  Available Sizes *
                </label>
                <div className="flex flex-wrap gap-3">
                  {["XXS", "XS", "S", "M", "L", "XL", "XXL"].map((size) => {
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
                          setSizes(updated.join(","));
                        }}
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-300
                          ${isSelected 
                            ? "border-[#8b4513] scale-110 shadow-md bg-[#fdf8f3]" 
                            : "border-gray-300 bg-white hover:scale-105"
                          } cursor-pointer
                        `}
                      >
                        {size}
                      </button>
                    );
                  })}
                </div>
                <input type="text" name="sizes" value={sizes} required readOnly hidden />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-4 bg-[#8b4513] text-white rounded-xl font-bold hover:bg-[#6b3410] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Updating...</span>
                    </div>
                  ) : (
                    "Update Product"
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={() => setModal({ type: "delete", open: true })}
                  className="flex-1 py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  Delete Product
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Confirmation Modals */}
        {modal.open && modal.type === "update" && (
          <ConfirmModal
            message="Are you sure you want to update this product?"
            onConfirm={() => handleSubmit()}
            onCancel={() => setModal({ ...modal, open: false })}
          />
        )}

        {modal.open && modal.type === "delete" && (
          <ConfirmModal
            message="Are you sure you want to delete this product? This action cannot be undone."
            onConfirm={deleteProduct}
            onCancel={() => setModal({ ...modal, open: false })}
          />
        )}
      </div>
    </Layout>
  </>
);

}
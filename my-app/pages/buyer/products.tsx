// pages/buyer/products.tsx
import Head from 'next/head'
import { prisma } from "../../lib/prisma";
import { GetServerSidePropsContext } from "next";
import { useState, useMemo, ChangeEvent, useEffect } from "react";
import Layout from "../../components/header";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import { useRouter } from "next/router";
import { useRef } from "react"; // add at the top
import Link from 'next/link'
import Image from 'next/image'

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  images: string[];
  colors: string[];
  sizes: string[];
  condition: string;
  era: string;
  quantity: number;
  ownerId: string;
  categories: { id: string; title: string }[];
  createdAt: string;
  updatedAt: string;
}

interface Category {
  id: string;
  title: string;
  order: number;
  parentId?: string | null;
}

interface User {
  id: string;
  name?: string | null;
  role: string;
}

interface ProductsPageProps {
  products: Product[];
  categories: Category[];
  user: User;
  initialMinPrice: 0;
  initialMaxPrice: 100;
}

type SortOption = "alpha" | "alphaDesc" | "priceAsc" | "priceDesc" | "relevance";

interface CategoryNode extends Category {
  children?: CategoryNode[];
}

export default function ProductsPage({ products, categories, user, initialMinPrice, initialMaxPrice }: ProductsPageProps) {
 // inside ProductsPage component
const initialQuerySynced = useRef(false);

 const router = useRouter();
  const [loadingProduct, setLoadingProduct] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [filtersVisible, setFiltersVisible] = useState(false);




const [minPrice, setMinPrice] = useState(initialMinPrice)
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice)
   const [activeThumb, setActiveThumb] = useState<'min' | 'max' | null>(null)
  const [minInput, setMinInput] = useState(minPrice)
  const [maxInput, setMaxInput] = useState(maxPrice)




  const allColors = Array.from(new Set(products.flatMap(p => p.colors)));
  const allSizes = Array.from(new Set(products.flatMap(p => p.sizes)));

  const categoryTree: CategoryNode[] = useMemo(() => {
    const map: Map<string, CategoryNode> = new Map(
      categories.map(c => [c.id, { ...c, children: [] }])
    );
    const roots: CategoryNode[] = [];
    map.forEach(cat => {
      if (cat.parentId && map.has(cat.parentId)) {
        map.get(cat.parentId)!.children!.push(cat);
      } else {
        roots.push(cat);
      }
    });
    return roots;
  }, [categories]);
 
// --- sync state from router query only once ---
useEffect(() => {
  if (!router.isReady || initialQuerySynced.current) return;

  setSearch((router.query.search as string) || "");
  setSelectedColors(router.query.colors ? (router.query.colors as string).split(",") : []);
  setSelectedSizes(router.query.sizes ? (router.query.sizes as string).split(",") : []);
  setSelectedCategories(router.query.categories ? (router.query.categories as string).split(",") : []);
  setSortBy((router.query.sortBy as SortOption) || "relevance");

  const prices = products.map(p => p.price);
  const min = router.query.priceMin ? Number(router.query.priceMin) : Math.min(...prices);
  const max = router.query.priceMax ? Number(router.query.priceMax) : Math.max(...prices);
  setPriceRange([min, max]);

  initialQuerySynced.current = true; // mark done
}, [router.query, router.isReady, products]);

// --- update router query only after initial sync ---
useEffect(() => {
  if (!router.isReady || !initialQuerySynced.current) return;

  const query: Record<string, string> = {};
  if (search) query.search = search;
  if (selectedColors.length) query.colors = selectedColors.join(",");
  if (selectedSizes.length) query.sizes = selectedSizes.join(",");
  if (selectedCategories.length) query.categories = selectedCategories.join(",");
  if (sortBy !== "relevance") query.sortBy = sortBy;

  const prices = products.map(p => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  if (priceRange[0] !== minPrice) query.priceMin = String(priceRange[0]);
  if (priceRange[1] !== maxPrice) query.priceMax = String(priceRange[1]);

  // Compare current router.query with new query
  const currentQuery: Record<string, string> = {};
  Object.entries(router.query).forEach(([key, val]) => {
    if (typeof val === "string") currentQuery[key] = val;
  });

  const isEqual =
    Object.keys(query).length === Object.keys(currentQuery).length &&
    Object.keys(query).every(key => query[key] === currentQuery[key]);

  if (!isEqual) {
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
  }
}, [search, selectedColors, selectedSizes, selectedCategories, sortBy, priceRange, products, router]);

  const handlePriceChange = (e: ChangeEvent<HTMLInputElement>, index: 0 | 1) => {
    const val = Number(e.target.value);
    setPriceRange(prev => (index === 0 ? [val, prev[1]] : [prev[0], val]));
  };

  const CategoryCheckbox: React.FC<{
    category: CategoryNode;
    selected: string[];
    setSelected: (ids: string[]) => void;
  }> = ({ category, selected, setSelected }) => {
    const [expanded, setExpanded] = useState(true);
    const isChecked = selected.includes(category.id);

    const allDescendantIds = useMemo(() => {
      const ids: string[] = [];
      const traverse = (node: CategoryNode) => {
        ids.push(node.id);
        node.children?.forEach(traverse);
      };
      traverse(category);
      return ids;
    }, [category]);

    const toggle = () => {
      if (isChecked) setSelected(selected.filter(id => !allDescendantIds.includes(id)));
      else setSelected([...new Set([...selected, ...allDescendantIds])]);
    };

    return (
      <div className="ml-2">
        <label className="flex items-center gap-1">
          {category.children?.length ? (
            <button type="button" className="mr-1 text-sm font-bold" onClick={() => setExpanded(p => !p)}>
              {expanded ? "▼" : "►"}
            </button>
          ) : null}
          <input type="checkbox" checked={isChecked} onChange={toggle} />
          {category.title}
        </label>
        {expanded && category.children?.length ? (
          <div className="ml-4 border-l border-gray-200 pl-2">
            {category.children.map(child => (
              <CategoryCheckbox key={child.id} category={child} selected={selected} setSelected={setSelected} />
            ))}
          </div>
        ) : null}
      </div>
    );
  };

const filteredProducts = useMemo(() => {
  let result = products
    // Price filter
    .filter(p => p.price >= priceRange[0] && p.price <= priceRange[1])

    // Colors filter
    .filter(p => {
      if (selectedColors.length === 0) return true; // "All" selected

      // Normalize product colors
      const productColors = p.colors
        .map(c => c.trim().toUpperCase())
        .filter(Boolean); // remove empty strings

      // Normalize selected colors
      const selectedColorsNormalized = selectedColors.map(c => c.trim().toUpperCase());

      // Check if at least one color matches
      return productColors.some(c => selectedColorsNormalized.includes(c));
    })

    // Sizes filter
    .filter(p => {
      if (selectedSizes.length === 0) return true; // "All" selected

      const productSizes = p.sizes
        .map(s => s.trim().toUpperCase())
        .filter(Boolean);

      const selectedSizesNormalized = selectedSizes.map(s => s.trim().toUpperCase());

      return productSizes.some(s => selectedSizesNormalized.includes(s));
    })

    // Categories filter
    .filter(p =>
      selectedCategories.length === 0 ||
      p.categories.some(cat => selectedCategories.includes(cat.id))
    );

  // Search filter
  if (search.trim()) {
    const searchLower = search.toLowerCase();
    result = result.filter(p => p.title.toLowerCase().includes(searchLower));
  }

  // Sorting
  switch (sortBy) {
    case "alpha": result.sort((a, b) => a.title.localeCompare(b.title)); break;
    case "alphaDesc": result.sort((a, b) => b.title.localeCompare(a.title)); break;
    case "priceAsc": result.sort((a, b) => a.price - b.price); break;
    case "priceDesc": result.sort((a, b) => b.price - a.price); break;
    case "relevance":
      const searchLower = search.toLowerCase();
      result.sort((a, b) => {
        const score = (title: string) =>
          title === searchLower ? 3 :
          title.startsWith(searchLower) ? 2 :
          title.includes(searchLower) ? 1 : 0;
        return score(b.title.toLowerCase()) - score(a.title.toLowerCase());
      });
      break;
  }

  return result;
}, [products, search, selectedColors, selectedSizes, selectedCategories, sortBy, priceRange]);

  // ----- Slider Handlers -----
  const startDrag = (e: React.MouseEvent | React.TouchEvent, thumb: 'min' | 'max') => {
    e.preventDefault()
    setActiveThumb(thumb)

    const move = (ev: MouseEvent | TouchEvent) => {
      const slider = document.querySelector(`.${styles.sliderContainer}`)?.getBoundingClientRect()
      if (!slider) return
      const clientX = 'touches' in ev ? ev.touches[0].clientX : ev.clientX
      let percent = ((clientX - slider.left) / slider.width) * 100
      percent = Math.max(0, Math.min(100, percent))
      percent = Math.round(percent)
      if (thumb === 'min') setMinPrice(Math.min(percent, maxPrice))
      else setMaxPrice(Math.max(percent, minPrice))
    }

    const stop = () => {
      setActiveThumb(null)
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', stop)
      window.removeEventListener('touchmove', move)
      window.removeEventListener('touchend', stop)
    }

    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', stop)
    window.addEventListener('touchmove', move, { passive: false })
    window.addEventListener('touchend', stop)
  }

  const handleSliderClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault()
    const slider = e.currentTarget.getBoundingClientRect()
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX
    let percent = ((clientX - slider.left) / slider.width) * 100
    percent = Math.round(percent)
    if (Math.abs(percent - minPrice) < Math.abs(percent - maxPrice)) setMinPrice(Math.min(percent, maxPrice))
    else setMaxPrice(Math.max(percent, minPrice))
  }

  const minPercent = minPrice
  const maxPercent = maxPrice

  useEffect(() => setMinInput(minPrice), [minPrice])
  useEffect(() => setMaxInput(maxPrice), [maxPrice])

return (
<>
<Head>
  <title>Shop Vintage Items | Vintage Marketplace</title>
  <meta name="description" content="Browse a curated selection of authentic vintage items from trusted sellers." />
</Head>
    <Layout categories={categories} user={user}>
      <div className="min-h-screen p-4 bg-[#fdf8f3] font-sans relative">
        {loadingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
            <div className="w-12 h-12 border-4 border-[#5a4436] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#3e2f25] mb-6 text-center sm:text-left">
            All Products
          </h1>

          {/* Search Bar + Reset */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
            <input
              type="text"
              placeholder="Search by title..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="input w-full sm:w-1/2 bg-white text-[#3e2f25]"
            />
            <button
              onClick={() => {
                setSearch("");
                setSelectedColors([]);
                setSelectedSizes([]);
                setSelectedCategories([]);
                setSortBy("relevance");
                const prices = products.map(p => p.price);
                setPriceRange([Math.min(...prices), Math.max(...prices)]);
                router.replace({ pathname: router.pathname, query: {} }, undefined, { shallow: true });
              }}
              className="px-4 py-2 bg-[#b58b5a] text-white rounded-xl hover:bg-[#d4b996] transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>

          {/* Toggle Filters */}
          <button
  className="mb-4 px-4 py-2 bg-[#5a4436] text-white rounded-xl transition-all duration-200 transform hover:bg-[#3e2f25] hover:scale-105 hover:shadow-lg"
  onClick={() => setFiltersVisible(prev => !prev)}
>
  {filtersVisible ? "Hide Filters" : "Show Filters"}
</button>

{/* Filters Panel */}
{filtersVisible && (
  <div className="flex flex-col gap-4 mb-6 p-4 bg-white rounded-2xl shadow-sm hover:shadow-md transition-all">
    
    {/* Sort & Price */}
    <div className="flex flex-wrap gap-4 items-center">
      <select
        value={sortBy}
        onChange={e => setSortBy(e.target.value as SortOption)}
        className="input bg-white text-[#3e2f25] rounded-lg border border-gray-300 p-2"
      >
        <option value="alpha">A → Z</option>
        <option value="alphaDesc">Z → A</option>
        <option value="priceAsc">Price ↑</option>
        <option value="priceDesc">Price ↓</option>
        <option value="relevance">Relevance</option>
      </select>


{/* Price Range Slider */}
<div className="flex flex-col gap-2 w-full max-w-md">
  {/* Slider Track */}
  <div
    className="relative h-2 bg-gray-300 rounded-full cursor-pointer"
    onMouseDown={handleSliderClick}
    onTouchStart={handleSliderClick}
  >
    {/* Active Range */}
    <div
      className="absolute h-2 bg-[#5a4436] rounded-full"
      style={{
        left: `${priceRange[0]}%`,
        right: `${100 - priceRange[1]}%`,
      }}
    />

    {/* Min Thumb */}
    <div
      className={`absolute w-5 h-5 bg-white border-2 border-[#3e2f25] rounded-full -top-1 cursor-pointer`}
      style={{ left: `${priceRange[0]}%`, zIndex: activeThumb === 'min' ? 4 : 2 }}
      onMouseDown={e => startDrag(e, 'min')}
      onTouchStart={e => startDrag(e, 'min')}
    />

    {/* Max Thumb */}
    <div
      className={`absolute w-5 h-5 bg-white border-2 border-[#3e2f25] rounded-full -top-1 cursor-pointer`}
      style={{ left: `${priceRange[1]}%`, zIndex: activeThumb === 'max' ? 4 : 2 }}
      onMouseDown={e => startDrag(e, 'max')}
      onTouchStart={e => startDrag(e, 'max')}
    />
  </div>

  {/* Input fields */}
  <div className="flex gap-2 items-center mt-2">
    <input
      type="number"
      min={0}
      max={100}
      value={priceRange[0]}
      onChange={e => setPriceRange([Math.min(Number(e.target.value), priceRange[1]), priceRange[1]])}
      onBlur={() => setPriceRange([Math.max(0, Math.min(priceRange[0], priceRange[1])), priceRange[1]])}
      className="input w-20 p-2 border rounded-lg text-[#3e2f25] bg-white"
    />
    <span className="text-[#3e2f25]">-</span>
    <input
      type="number"
      min={0}
      max={100}
      value={priceRange[1]}
      onChange={e => setPriceRange([priceRange[0], Math.max(Number(e.target.value), priceRange[0])])}
      onBlur={() => setPriceRange([priceRange[0], Math.min(priceRange[1], 100)])}
      className="input w-20 p-2 border rounded-lg text-[#3e2f25] bg-white"
    />
  </div>
</div>





    </div>

    {/* Color Circles */}
    <div className="flex flex-wrap gap-3 my-4">
      <button
        type="button"
        onClick={() => setSelectedColors([])}
        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-200 
          ${selectedColors.length === 0 ? "border-[#3e2f25] bg-[#fdf8f3]" : "border-gray-300 bg-white"}
          hover:scale-110 hover:shadow-md cursor-pointer
        `}
      >
        All
      </button>

      {Array.from(
        new Set(allColors.map(c => c.trim().toUpperCase()).filter(Boolean))
      ).map(c => {
        const isSelected = selectedColors
          .map(sc => sc.trim().toUpperCase())
          .includes(c);

        return (
          <button
            key={c}
            type="button"
            onClick={() => {
              if (isSelected) {
                setSelectedColors(selectedColors.filter(sc => sc.trim().toUpperCase() !== c));
              } else {
                setSelectedColors([...selectedColors, c]);
              }
            }}
            className={`w-10 h-10 rounded-full border-2 transition-all duration-200 flex items-center justify-center
              ${isSelected ? "border-[#3e2f25] scale-110 shadow-md" : "border-gray-300"}
              hover:scale-110 hover:shadow-md cursor-pointer
            `}
            style={{ backgroundColor: c.toLowerCase() }}
          />
        );
      })}
    </div>

    {/* Size Circles */}
    <div className="flex flex-wrap gap-3 my-4">
      <button
        type="button"
        onClick={() => setSelectedSizes([])}
        className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-200 
          ${selectedSizes.length === 0 ? "border-[#3e2f25] bg-[#fdf8f3]" : "border-gray-300 bg-white"}
          hover:scale-105 hover:shadow-md cursor-pointer
        `}
      >
        All
      </button>

      {Array.from(
        new Set(allSizes.map(s => s.trim().toUpperCase()).filter(Boolean))
      ).map(size => {
        const isSelected = selectedSizes.map(s => s.trim().toUpperCase()).includes(size);
        return (
          <button
            key={size}
            type="button"
            onClick={() => {
              if (isSelected) {
                setSelectedSizes(selectedSizes.filter(s => s.trim().toUpperCase() !== size));
              } else {
                setSelectedSizes([...selectedSizes, size]);
              }
            }}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-200
              ${isSelected ? "border-[#3e2f25] scale-110 shadow-md" : "border-gray-300"}
              hover:scale-110 hover:shadow-md cursor-pointer
            `}
          >
            {size}
          </button>
        );
      })}
    </div>

    {/* Categories */}
    <div className="flex flex-col gap-2 max-h-64 overflow-y-auto bg-white p-2 rounded-2xl border shadow-sm">
      {categoryTree.map(cat => (
        <CategoryCheckbox
          key={cat.id}
          category={cat}
          selected={selectedCategories}
          setSelected={setSelectedCategories}
        />
      ))}
    </div>
  </div>
)}

{/* Products Grid */}
{filteredProducts.length === 0 ? (
  <p className="text-center text-[#3e2f25] font-medium mt-6">
    No products found.
  </p>
) : (
  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    {filteredProducts.map((product) => (
      <Link
        key={product.id}
        href={`/buyer/products/${product.id}`}
        className="group block bg-white rounded-xl shadow-md overflow-hidden border border-gray-200 hover:shadow-xl transition-transform duration-200 hover:scale-105 active:scale-95"
      >
        {/* Image Wrapper */}
        {product.images[0] && (
          <div className="relative w-full h-48 lg:h-80 overflow-hidden">
            <img
              src={product.images[0]}
              alt={product.title}
              className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 ${
                product.quantity === 0 ? "opacity-70" : ""
              }`}
            />

            {/* Sold Out Ribbon */}
            {product.quantity === 0 && (
              <div className="absolute top-2 left-0 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-br-lg transform -rotate-12 shadow-lg z-10">
                Sold Out
              </div>
            )}
          </div>
        )}

        {/* Card Content */}
        <div className="p-4 text-center">
          <h2 className="text-base md:text-lg font-semibold text-[#3e2f25] truncate group-hover:text-[#5a4436] transition-colors duration-200">
            {product.title}
          </h2>
          <p className="mt-2 text-[#5a4436] font-bold text-sm md:text-base">
            KWD {product.price.toFixed(2)}
          </p>
        </div>
      </Link>
    ))}
  </div>
)}

          <style jsx>{`
            .input {
              padding: 0.5rem 0.75rem;
              border-radius: 0.75rem;
              border: 1px solid #ccc;
              transition: border 0.2s, box-shadow 0.2s;
            }
            .input:focus {
              outline: none;
              border-color: #5a4436;
              box-shadow: 0 0 0 2px rgba(90, 68, 54, 0.2);
            }
          `}</style>
        </div>
      </div>
    </Layout>
</>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session || !session.user?.id) return { redirect: { destination: "/login", permanent: false } };

  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { categories: { include: { category: { select: { id: true, title: true } } } } },
  });

  const categories = await prisma.category.findMany({
    select: { id: true, title: true, order: true, parentId: true },
    orderBy: { order: "asc" },
  });

  return {
    props: {
      products: products.map(p => ({
        ...p,
        categories: p.categories.map(pc => pc.category),
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      categories,
      user: {
        id: session.user.id,
        name: session.user.name || "Guest",
        role: session.user.role,
      },
    },
  };
}
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
}

type SortOption = "alpha" | "alphaDesc" | "priceAsc" | "priceDesc" | "relevance";

interface CategoryNode extends Category {
  children?: CategoryNode[];
}

export default function ProductsPage({ products, categories, user }: ProductsPageProps) {
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
      .filter(p => p.price >= priceRange[0] && p.price <= priceRange[1])
      .filter(p => selectedColors.length === 0 || p.colors.some(c => selectedColors.includes(c)))
      .filter(p => selectedSizes.length === 0 || p.sizes.some(s => selectedSizes.includes(s)))
      .filter(p => selectedCategories.length === 0 || p.categories.some(cat => selectedCategories.includes(cat.id)));

    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(p => p.title.toLowerCase().includes(searchLower));
    }

    switch (sortBy) {
      case "alpha": result.sort((a, b) => a.title.localeCompare(b.title)); break;
      case "alphaDesc": result.sort((a, b) => b.title.localeCompare(a.title)); break;
      case "priceAsc": result.sort((a, b) => a.price - b.price); break;
      case "priceDesc": result.sort((a, b) => b.price - a.price); break;
      case "relevance":
        const searchLower = search.toLowerCase();
        result.sort((a, b) => {
          const score = (title: string) =>
            title === searchLower ? 3 : title.startsWith(searchLower) ? 2 : title.includes(searchLower) ? 1 : 0;
          return score(b.title.toLowerCase()) - score(a.title.toLowerCase());
        });
        break;
    }
    return result;
  }, [products, search, selectedColors, selectedSizes, selectedCategories, sortBy, priceRange]);

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
              className="px-4 py-2 bg-[#b58b5a] text-white rounded-xl hover:bg-[#d4b996] transition"
            >
              Reset Filters
            </button>
          </div>

          {/* Toggle Filters */}
          <button
            className="mb-4 px-4 py-2 bg-[#5a4436] text-white rounded-xl"
            onClick={() => setFiltersVisible(prev => !prev)}
          >
            {filtersVisible ? "Hide Filters" : "Show Filters"}
          </button>

          {/* Filters Panel */}
          {filtersVisible && (
            <div className="flex flex-wrap gap-3 mb-6 items-start bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition">
              <select value={sortBy} onChange={e => setSortBy(e.target.value as SortOption)} className="input bg-white text-[#3e2f25]">
                <option value="alpha">A → Z</option>
                <option value="alphaDesc">Z → A</option>
                <option value="priceAsc">Price ↑</option>
                <option value="priceDesc">Price ↓</option>
                <option value="relevance">Relevance</option>
              </select>

              <div className="flex gap-2 items-center">
                <input type="number" value={priceRange[0]} min={0} onChange={e => handlePriceChange(e, 0)} className="input w-20 bg-white text-[#3e2f25]" />
                <span className="text-[#3e2f25]">-</span>
                <input type="number" value={priceRange[1]} min={0} onChange={e => handlePriceChange(e, 1)} className="input w-20 bg-white text-[#3e2f25]" />
              </div>

              <select multiple value={selectedColors} onChange={e => setSelectedColors(Array.from(e.target.selectedOptions, o => o.value))} className="input flex-grow min-w-[100px] bg-white text-[#3e2f25]">
                {allColors.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select multiple value={selectedSizes} onChange={e => setSelectedSizes(Array.from(e.target.selectedOptions, o => o.value))} className="input flex-grow min-w-[100px] bg-white text-[#3e2f25]">
                {allSizes.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              <div className="flex flex-col gap-1 max-h-64 overflow-y-auto bg-white p-2 rounded-2xl border shadow-sm">
                {categoryTree.map(cat => (
                  <CategoryCheckbox key={cat.id} category={cat} selected={selectedCategories} setSelected={setSelectedCategories} />
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
          <div className="relative w-full h-48 overflow-hidden">
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
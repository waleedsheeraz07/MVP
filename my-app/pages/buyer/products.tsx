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
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedEras, setSelectedEras] = useState<string[]>([]);

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

  // Search
  setSearch((router.query.search as string) || "");

  // Colors
  setSelectedColors(
    router.query.colors
      ? (router.query.colors as string).split(",").map(c => c.trim().toUpperCase())
      : []
  );

  // Sizes
  setSelectedSizes(
    router.query.sizes
      ? (router.query.sizes as string).split(",").map(s => s.trim().toUpperCase())
      : []
  );

  // Categories
  setSelectedCategories(
    router.query.categories
      ? (router.query.categories as string).split(",")
      : []
  );

  // Sort
  setSortBy((router.query.sortBy as SortOption) || "relevance");

  // Conditions
  setSelectedConditions(
    router.query.conditions
      ? (router.query.conditions as string).split(",").map(c => c.trim().toLowerCase())
      : []
  );

setSelectedEras(
  router.query.eras
    ? (router.query.eras as string).split(",")
    : []
);

  // Price
  const prices = products.map(p => p.price);
  const min = router.query.priceMin ? Number(router.query.priceMin) : Math.min(...prices);
  const max = router.query.priceMax ? Number(router.query.priceMax) : Math.max(...prices);
  setPriceRange([min, max]);

  initialQuerySynced.current = true;
}, [router.query, router.isReady, products]);

useEffect(() => {
  if (!router.isReady || !initialQuerySynced.current) return;

  const query: Record<string, string> = {};

  if (search) query.search = search;
  if (selectedColors.length) query.colors = selectedColors.join(",");
  if (selectedSizes.length) query.sizes = selectedSizes.join(",");
  if (selectedCategories.length) query.categories = selectedCategories.join(",");
  if (sortBy !== "relevance") query.sortBy = sortBy;
  if (selectedConditions.length) query.conditions = selectedConditions.join(",");
  if (selectedEras.length) query.eras = selectedEras.join(",");

  const prices = products.map(p => p.price);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  if (priceRange[0] !== minPrice) query.priceMin = String(priceRange[0]);
  if (priceRange[1] !== maxPrice) query.priceMax = String(priceRange[1]);

  // Compare with current router.query
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
}, [
  search,
  selectedColors,
  selectedSizes,
  selectedCategories,
  selectedConditions,
  selectedEras, // ✅ included
  sortBy,
  priceRange,
  products,
  router
]);

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


// Condition filter (multi-select)
.filter(p => {
  if (selectedConditions.length === 0) return true; // no filter
  return selectedConditions.includes(p.condition.toLowerCase().trim());
})

// Era filter
.filter(p => {
  if (selectedEras.length === 0) return true; // no filter

  return selectedEras.some(era => {
    if (era === "before1900") {
      // ✅ Point 2: handle range/any single year before 1900
      const productYear = Number(p.era.split("–")[0]); // get starting year
      return productYear < 1900;
    } else {
      return p.era === era; // match exact decade string
    }
  });
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
}, [products, search, selectedColors, selectedSizes, selectedCategories, selectedConditions, selectedEras, sortBy, priceRange]);

const eras = [
    "before1900",
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
];

return (
  <>
    <Head>
      <title>Shop Vintage Treasures | Vintage Marketplace</title>
      <meta name="description" content="Discover authentic vintage items from trusted collectors. Curated selection with guaranteed authenticity." />
    </Head>
    
    <Layout categories={categories} user={user}>
      <div className="min-h-screen bg-[#fefaf5] font-sans relative">
        {/* Loading Overlay */}
        {loadingProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm">
            <div className="bg-white p-6 rounded-2xl shadow-xl flex items-center space-x-4">
              <div className="w-8 h-8 border-3 border-[#8b4513] border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[#3e2f25] font-medium">Loading...</span>
            </div>
          </div>
        )}

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Header Section */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#3e2f25] mb-4">
              Vintage Treasures
            </h1>
            <p className="text-lg sm:text-xl text-[#5a4436] max-w-2xl mx-auto">
              Discover authentic pieces with stories to tell. Each item carefully curated for quality and character.
            </p>
          </div>

          {/* Search and Controls Bar */}
          <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
              {/* Search Input */}
              <div className="flex-1 w-full lg:max-w-md">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search vintage items..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#8b4513]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
                {/* Filters Toggle */}
                <button
                  onClick={() => setFiltersVisible(prev => !prev)}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-[#8b4513] text-white rounded-xl font-semibold hover:bg-[#6b3410] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer"
                >
                  <span>{filtersVisible ? "Hide Filters" : "Show Filters"}</span>
                  <svg className={`w-4 h-4 transform transition-transform ${filtersVisible ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Reset Filters */}
                <button
                  onClick={() => {
                    setSearch("");
                    setSelectedColors([]);
                    setSelectedSizes([]);
                    setSelectedCategories([]);
                    setSelectedConditions([]);
                    setSelectedEras([]);
                    setSortBy("relevance");
                    const prices = products.map(p => p.price);
                    setPriceRange([Math.min(...prices), Math.max(...prices)]);
                    router.replace({ pathname: router.pathname, query: {} }, undefined, { shallow: true });
                  }}
                  className="flex items-center justify-center space-x-2 px-6 py-3 bg-transparent border-2 border-[#8b4513] text-[#8b4513] rounded-xl font-semibold hover:bg-[#8b4513] hover:text-white transform hover:scale-105 transition-all duration-300 cursor-pointer"
                >
                  <span>Reset All</span>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          {filtersVisible && (
            <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 transform transition-all duration-300">
              {/* Sort & Price Header */}
              <div className="flex flex-col lg:flex-row gap-6 mb-8">
                {/* Sort By */}
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-[#3e2f25] mb-3">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as SortOption)}
                    className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
                  >
                    <option value="relevance">Relevance</option>
                    <option value="alpha">Name: A → Z</option>
                    <option value="alphaDesc">Name: Z → A</option>
                    <option value="priceAsc">Price: Low to High</option>
                    <option value="priceDesc">Price: High to Low</option>
                    <option value="newest">Newest First</option>
                  </select>
                </div>

                {/* Price Range */}
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-[#3e2f25] mb-3">Price Range</label>
                  <div className="flex items-center space-x-4">
                    <div className="relative flex-1">
                      <input
                        type="number"
                        value={priceRange[0]}
                        min={0}
                        onChange={e => handlePriceChange(e, 0)}
                        className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
                        placeholder="Min"
                      />
                    </div>
                    <span className="text-[#8b4513] font-semibold">-</span>
                    <div className="relative flex-1">
                      <input
                        type="number"
                        value={priceRange[1]}
                        min={0}
                        onChange={e => handlePriceChange(e, 1)}
                        className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
                        placeholder="Max"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Filter Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                {/* Colors */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#3e2f25]">Colors</h3>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedColors([])}
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-300
                        ${selectedColors.length === 0 
                          ? "border-[#8b4513] bg-[#fdf8f3] scale-110 shadow-md" 
                          : "border-gray-300 bg-white hover:scale-105"
                        } cursor-pointer`}
                    >
                      All
                    </button>
                    {Array.from(new Set(allColors.map(c => c.trim().toUpperCase()).filter(Boolean))).map(c => {
                      const isSelected = selectedColors.map(sc => sc.trim().toUpperCase()).includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => {
                            if (isSelected) setSelectedColors(selectedColors.filter(sc => sc.trim().toUpperCase() !== c));
                            else setSelectedColors([...selectedColors, c]);
                          }}
                          className={`w-12 h-12 rounded-full border-2 transition-all duration-300 flex items-center justify-center
                            ${isSelected ? "border-[#8b4513] scale-110 shadow-md" : "border-gray-300 hover:scale-105"}
                            cursor-pointer
                          `}
                          style={{ backgroundColor: c.toLowerCase() }}
                          title={c}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Sizes */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#3e2f25]">Sizes</h3>
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={() => setSelectedSizes([])}
                      className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-300
                        ${selectedSizes.length === 0 
                          ? "border-[#8b4513] bg-[#fdf8f3] scale-110 shadow-md" 
                          : "border-gray-300 bg-white hover:scale-105"
                        } cursor-pointer`}
                    >
                      All
                    </button>
                    {Array.from(new Set(allSizes.map(s => s.trim().toUpperCase()).filter(Boolean))).map(size => {
                      const isSelected = selectedSizes.map(s => s.trim().toUpperCase()).includes(size);
                      return (
                        <button
                          key={size}
                          type="button"
                          onClick={() => {
                            if (isSelected) setSelectedSizes(selectedSizes.filter(s => s.trim().toUpperCase() !== size));
                            else setSelectedSizes([...selectedSizes, size]);
                          }}
                          className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-300
                            ${isSelected ? "border-[#8b4513] scale-110 shadow-md bg-[#fdf8f3]" : "border-gray-300 bg-white hover:scale-105"}
                            cursor-pointer
                          `}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Condition */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#3e2f25]">Condition</h3>
                  <div className="space-y-3">
                    {["Excellent", "Good", "Fair", "Slightly Damaged", "Highly Damaged"].map(cond => {
                      const normalized = cond.toLowerCase().trim();
                      const isSelected = selectedConditions.includes(normalized);
                      return (
                        <button
                          key={cond}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedConditions(selectedConditions.filter(c => c !== normalized));
                            } else {
                              setSelectedConditions([...selectedConditions, normalized]);
                            }
                          }}
                          className={`w-full px-4 py-3 rounded-xl text-left transition-all duration-300 cursor-pointer
                            ${isSelected 
                              ? "bg-[#8b4513] text-white shadow-md transform scale-105" 
                              : "bg-[#fdf8f3] text-[#3e2f25] hover:bg-[#e6d9c6] hover:scale-105"
                            }
                          `}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{cond}</span>
                            {isSelected && (
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Era */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-[#3e2f25]">Era</h3>
                  <div className="flex flex-wrap gap-3">
                    {eras.map((era) => {
                      const isSelected = selectedEras.includes(era);
                      return (
                        <button
                          key={era}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedEras(selectedEras.filter(e => e !== era));
                            } else {
                              setSelectedEras([...selectedEras, era]);
                            }
                          }}
                          className={`px-4 py-2 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-300
                            ${isSelected 
                              ? "border-[#8b4513] scale-110 shadow-md bg-[#fdf8f3] text-[#8b4513]" 
                              : "border-gray-300 bg-white text-[#3e2f25] hover:scale-105"
                            } cursor-pointer
                          `}
                        >
                          {era}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Categories */}
                <div className="space-y-4 lg:col-span-2 xl:col-span-1">
                  <h3 className="text-lg font-semibold text-[#3e2f25]">Categories</h3>
                  <div className="max-h-48 overflow-y-auto space-y-2 bg-[#fdf8f3] p-4 rounded-xl border border-[#e6d9c6]">
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
              </div>
            </div>
          )}

          {/* Results Count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-[#5a4436] font-medium">
              Showing <span className="text-[#8b4513] font-bold">{filteredProducts.length}</span> vintage items
            </p>
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-[#e6d9c6] rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-[#8b4513]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#3e2f25] mb-2">No treasures found</h3>
              <p className="text-[#5a4436] mb-6">Try adjusting your filters or search terms</p>
              <button
                onClick={() => {
                  setSearch("");
                  setSelectedColors([]);
                  setSelectedSizes([]);
                  setSelectedCategories([]);
                  setSelectedConditions([]);
                  setSelectedEras([]);
                }}
                className="px-8 py-3 bg-[#8b4513] text-white rounded-xl font-semibold hover:bg-[#6b3410] transform hover:scale-105 transition-all duration-300"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
              {filteredProducts.map((product) => (
                <Link
                  key={product.id}
                  href={`/buyer/products/${product.id}`}
                  className="group block bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-105 cursor-pointer"
                >
                  {/* Product Image */}
                  <div className="relative w-full h-64 sm:h-72 lg:h-80 overflow-hidden">
                    {product.images[0] ? (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${
                          product.quantity === 0 ? "opacity-70 grayscale" : ""
                        }`}
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#e6d9c6] to-[#d4b996] flex items-center justify-center">
                        <span className="text-[#5a4436] text-sm font-medium">Image Coming Soon</span>
                      </div>
                    )}

                    {/* Sold Out Overlay */}
                    {product.quantity === 0 && (
                      <>
                        <div className="absolute inset-0 bg-black/50"></div>
                        <div className="absolute top-4 left-4 bg-[#8b4513] text-white px-3 py-1 rounded-full text-xs font-bold transform -rotate-12 shadow-lg">
                          Sold Out
                        </div>
                      </>
                    )}

                    {/* Quick View Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="bg-white/90 text-[#8b4513] px-4 py-2 rounded-full font-semibold transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                        View Details
                      </span>
                    </div>
                  </div>

                  {/* Product Info */}
                  <div className="p-4 sm:p-6">
                    <h3 className="text-lg font-bold text-[#3e2f25] mb-2 line-clamp-2 group-hover:text-[#8b4513] transition-colors duration-300">
                      {product.title}
                    </h3>
                    {product.description && (
                      <p className="text-[#5a4436] text-sm mb-3 line-clamp-2">
                        {product.description}
                      </p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold text-[#8b4513]">
                        KWD {product.price.toFixed(2)}
                      </span>
                     
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  </>
);

}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

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
        id: session?.user?.id ?? "Guest",
        name: session?.user?.name ?? "Guest",
        role: session?.user?.role ?? "Guest",
},
    },
  };
}
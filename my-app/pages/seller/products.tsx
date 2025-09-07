// pages/seller/products.tsx
import { prisma } from "../../lib/prisma";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import { GetServerSidePropsContext } from "next";
import { useState, useMemo, ChangeEvent, useEffect } from "react";
import Layout from "../../components/header";
import { useRouter } from "next/router";

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  images: string[];
  colors: string[];
  sizes: string[];
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

interface MyProductsPageProps {
  products: Product[];
  categories: Category[];
  user: User;
}

type SortOption = "alpha" | "alphaDesc" | "priceAsc" | "priceDesc" | "relevance";

interface CategoryNode extends Category {
  children?: CategoryNode[];
}

export default function MyProductsPage({ products, categories, user }: MyProductsPageProps) {
 const router = useRouter();
 const [search, setSearch] = useState("");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [priceRange, setPriceRange] = useState<[number, number]>(() => {
    const prices = products.map(p => p.price);
    return [Math.min(...prices), Math.max(...prices)];
  });
  const [filtersVisible, setFiltersVisible] = useState(false);

  const allColors = Array.from(new Set(products.flatMap(p => p.colors)));
  const allSizes = Array.from(new Set(products.flatMap(p => p.sizes)));

  // Category tree
  const categoryTree: CategoryNode[] = useMemo(() => {
    const map: Map<string, CategoryNode> = new Map(categories.map(c => [c.id, { ...c, children: [] }]));
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

  // Recursive category checkbox
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
  if (isChecked) {
    const newSelected = selected.filter(id => !allDescendantIds.includes(id));
    setSelected(newSelected);
  } else {
    const newSelected = Array.from(new Set([...selected, ...allDescendantIds]));
    setSelected(newSelected);
  }
};

    return (
      <div className="ml-2">
        <label className="flex items-center gap-1">
          {category.children?.length ? (
            <button type="button" className="mr-1 text-sm font-bold" onClick={() => setExpanded(prev => !prev)}>
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

  // Filter products
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

  const handlePriceChange = (e: ChangeEvent<HTMLInputElement>, index: 0 | 1) => {
    const val = Number(e.target.value);
    setPriceRange(prev => index === 0 ? [val, prev[1]] : [prev[0], val]);
  };

  // Sync filters to URL
  useEffect(() => {
    const query: Record<string, string> = {};
    if (search) query.search = search;
    if (selectedColors.length) query.colors = selectedColors.join(",");
    if (selectedSizes.length) query.sizes = selectedSizes.join(",");
    if (selectedCategories.length) query.categories = selectedCategories.join(",");
    if (sortBy !== "relevance") query.sortBy = sortBy;
    const minPrice = Math.min(...products.map(p => p.price));
    const maxPrice = Math.max(...products.map(p => p.price));
    if (priceRange[0] !== minPrice) query.priceMin = String(priceRange[0]);
    if (priceRange[1] !== maxPrice) query.priceMax = String(priceRange[1]);
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
  }, [search, selectedColors, selectedSizes, selectedCategories, sortBy, priceRange]);

  return (
    <Layout categories={categories} user={user}>
      <div className="min-h-screen p-4 bg-[#fdf8f3] font-sans">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#3e2f25]">My Products</h1>
            <Link href="/seller/sell">
              <button className="px-4 py-2 bg-[#3e2f25] text-[#fdf8f3] rounded-lg hover:bg-[#5a4436] transition-all duration-150 active:scale-95">
                Add New Product
              </button>
            </Link>
          </div>

 {/* Toggle Filters */}
<button
  className="mb-4 px-4 py-2 bg-[#5a4436] text-white rounded-xl"
  onClick={() => setFiltersVisible(prev => !prev)}
>
  {filtersVisible ? "Hide Filters" : "Show Filters"}
</button>

{filtersVisible && (
  <div className="flex flex-wrap gap-3 mb-6 items-start bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition">
    
    {/* Reset Filters Button */}
    <button
      onClick={() => {
        setSearch("");
        setSelectedColors([]);
        setSelectedSizes([]);
        setSelectedCategories([]);
        setSortBy("relevance");
        const prices = products.map(p => p.price);
        setPriceRange([Math.min(...prices), Math.max(...prices)]);

        // Update URL shallowly
        router.replace(
          { pathname: router.pathname, query: {} },
          undefined,
          { shallow: true }
        );
      }}
      className="px-4 py-2 bg-[#b58b5a] text-white rounded-xl hover:bg-[#d4b996] transition mb-2"
    >
      Reset Filters
    </button>

    {/* Search */}
    <input
      type="text"
      placeholder="Search by title..."
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      className="input flex-grow min-w-[150px] bg-white text-[#3e2f25]"
    />

    {/* Sort */}
    <select
      value={sortBy}
      onChange={e => setSortBy(e.target.value as SortOption)}
      className="input bg-white text-[#3e2f25]"
    >
      <option value="alpha">A → Z</option>
      <option value="alphaDesc">Z → A</option>
      <option value="priceAsc">Price ↑</option>
      <option value="priceDesc">Price ↓</option>
      <option value="relevance">Relevance</option>
    </select>

    {/* Price Range */}
    <div className="flex gap-2 items-center">
      <input
        type="number"
        value={priceRange[0]}
        min={0}
        onChange={e => handlePriceChange(e, 0)}
        className="input w-20 bg-white text-[#3e2f25]"
      />
      <span className="text-[#3e2f25]">-</span>
      <input
        type="number"
        value={priceRange[1]}
        min={0}
        onChange={e => handlePriceChange(e, 1)}
        className="input w-20 bg-white text-[#3e2f25]"
      />
    </div>

    {/* Colors */}
    <select
      multiple
      value={selectedColors}
      onChange={e => setSelectedColors(Array.from(e.target.selectedOptions, o => o.value))}
      className="input flex-grow min-w-[100px] bg-white text-[#3e2f25]"
    >
      {allColors.map(c => <option key={c} value={c}>{c}</option>)}
    </select>

    {/* Sizes */}
    <select
      multiple
      value={selectedSizes}
      onChange={e => setSelectedSizes(Array.from(e.target.selectedOptions, o => o.value))}
      className="input flex-grow min-w-[100px] bg-white text-[#3e2f25]"
    >
      {allSizes.map(s => <option key={s} value={s}>{s}</option>)}
    </select>

    {/* Category Tree */}
    <div className="flex flex-col gap-1 max-h-64 overflow-y-auto bg-white p-2 rounded-2xl border shadow-sm">
      {categoryTree.map(cat => (
        <CategoryCheckbox key={cat.id} category={cat} selected={selectedCategories} setSelected={setSelectedCategories} />
      ))}
    </div>
  </div>
)}

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <p className="text-center text-[#3e2f25] font-medium mt-6">No products found.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map(p => (
                <Link key={p.id} href={`/seller/products/${p.id}`} className="block">
                  <div className="bg-[#fffdfb] rounded-2xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition h-[320px] flex flex-col">
                    {p.images[0] && <img src={p.images[0]} alt={p.title} className="w-full h-48 object-cover" />}
                    <div className="p-3 flex-grow flex flex-col justify-between">
                      <h2 className="text-lg font-semibold text-[#3e2f25] truncate">{p.title}</h2>
                      <p className="mt-2 font-bold text-[#5a4436]">${p.price.toFixed(2)}</p>
                    </div>
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
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session?.user?.id) return { redirect: { destination: "/login", permanent: false } };

  const products = await prisma.product.findMany({
    where: { ownerId: session.user.id },
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
      user: { id: session.user.id, name: session.user.name || "Guest", role: session.user.role },
    },
  };
}
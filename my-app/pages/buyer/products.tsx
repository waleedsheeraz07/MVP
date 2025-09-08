// pages/buyer/products.tsx
import { useState, useEffect, useMemo, ChangeEvent } from "react";
import Layout from "../../components/header";
import { useRouter } from "next/router";

interface Product {
  id: string;
  title: string;
  price: number;
  images: string[];
  colors: string[];
  sizes: string[];
  categories: { id: string; title: string }[];
}

interface Category {
  id: string;
  title: string;
  order: number;
  parentId?: string | null;
  children?: Category[]; // <-- Add this explicitly
}

interface User {
  id: string;
  name: string;
  role: string;
}

type SortOption = "alpha" | "alphaDesc" | "priceAsc" | "priceDesc" | "relevance";

export default function ProductsPage({ user }: { user: User }) {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProduct, setLoadingProduct] = useState(false);

  // Filters
  const [search, setSearch] = useState("");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [filtersVisible, setFiltersVisible] = useState(false);

  // Fetch products/categories SPA-style
  useEffect(() => {
    setLoading(true);
    fetch("/api/products")
      .then(res => res.json())
      .then(data => {
        setProducts(data.products);
        setCategories(data.categories);
        const prices = data.products.map((p: Product) => p.price);
        setPriceRange([Math.min(...prices), Math.max(...prices)]);
      })
      .finally(() => setLoading(false));
  }, []);

  const allColors = useMemo(() => Array.from(new Set(products.flatMap(p => p.colors))), [products]);
  const allSizes = useMemo(() => Array.from(new Set(products.flatMap(p => p.sizes))), [products]);

  // Category tree
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

  const handlePriceChange = (e: ChangeEvent<HTMLInputElement>, index: 0 | 1) => {
    const val = Number(e.target.value);
    setPriceRange(prev => (index === 0 ? [val, prev[1]] : [prev[0], val]));
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

  // Recursive category checkbox
  const CategoryCheckbox: React.FC<{ category: Category; selected: string[]; setSelected: (ids: string[]) => void }> = ({ category, selected, setSelected }) => {
    const [expanded, setExpanded] = useState(true);
    const isChecked = selected.includes(category.id);

    const allDescendantIds = useMemo(() => {
      const ids: string[] = [];
      const traverse = (node: Category) => {
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

  if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="w-12 h-12 border-4 border-[#5a4436] border-t-transparent rounded-full animate-spin"></div></div>;

  return (
    <Layout categories={categories} user={user}>
      <div className="min-h-screen p-4 bg-[#fdf8f3] font-sans relative">
        {loadingProduct && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20"><div className="w-12 h-12 border-4 border-[#5a4436] border-t-transparent rounded-full animate-spin"></div></div>}

        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#3e2f25] mb-6 text-center sm:text-left">All Products</h1>

          {/* Search + Reset */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
            <input type="text" placeholder="Search by title..." value={search} onChange={e => setSearch(e.target.value)} className="input w-full sm:w-1/2 bg-white text-[#3e2f25]" />
            <button onClick={() => { setSearch(""); setSelectedColors([]); setSelectedSizes([]); setSelectedCategories([]); setSortBy("relevance"); const prices = products.map(p => p.price); setPriceRange([Math.min(...prices), Math.max(...prices)]); }} className="px-4 py-2 bg-[#b58b5a] text-white rounded-xl hover:bg-[#d4b996] transition">Reset Filters</button>
          </div>

          {/* Toggle Filters */}
          <button className="mb-4 px-4 py-2 bg-[#5a4436] text-white rounded-xl" onClick={() => setFiltersVisible(prev => !prev)}>{filtersVisible ? "Hide Filters" : "Show Filters"}</button>

          {/* Filters Panel */}
          {filtersVisible && <div className="flex flex-wrap gap-3 mb-6 items-start bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition">
            <select value={sortBy} onChange={e => setSortBy(e.target.value as SortOption)} className="input bg-white text-[#3e2f25]">
              <option value="alpha">A → Z</option>
              <option value="alphaDesc">Z → A</option>
              <option value="priceAsc">Price ↑</option>
              <option value="priceDesc">Price ↓</option>
              <option value="relevance">Relevance</option>
            </select>
            <div className="flex gap-2 items-center">
              <input type="number" value={priceRange[0]} min={0} onChange={e => handlePriceChange(e,0)} className="input w-20 bg-white text-[#3e2f25]" />
              <span className="text-[#3e2f25]">-</span>
              <input type="number" value={priceRange[1]} min={0} onChange={e => handlePriceChange(e,1)} className="input w-20 bg-white text-[#3e2f25]" />
            </div>
            <select multiple value={selectedColors} onChange={e => setSelectedColors(Array.from(e.target.selectedOptions, o => o.value))} className="input flex-grow min-w-[100px] bg-white text-[#3e2f25]">{allColors.map(c => <option key={c} value={c}>{c}</option>)}</select>
            <select multiple value={selectedSizes} onChange={e => setSelectedSizes(Array.from(e.target.selectedOptions, o => o.value))} className="input flex-grow min-w-[100px] bg-white text-[#3e2f25]">{allSizes.map(s => <option key={s} value={s}>{s}</option>)}</select>
            <div className="flex flex-col gap-1 max-h-64 overflow-y-auto bg-white p-2 rounded-2xl border shadow-sm">{categoryTree.map(cat => <CategoryCheckbox key={cat.id} category={cat} selected={selectedCategories} setSelected={setSelectedCategories} />)}</div>
          </div>}

          {/* Products Grid */}
          {filteredProducts.length === 0 ? <p className="text-center text-[#3e2f25] font-medium mt-6">No products found.</p> : (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map(product => (
                <div key={product.id} onClick={() => { setLoadingProduct(true); router.push(`/buyer/products/${product.id}`); }} className="block bg-[#fffdfb] rounded-2xl shadow-md overflow-hidden flex flex-col border-2 border-[#5a4436] cursor-pointer transition-transform transition-shadow duration-200 hover:shadow-xl hover:scale-105 active:scale-95 h-[340px]">
                  {product.images[0] && <div className="relative overflow-hidden"><img src={product.images[0]} alt={product.title} className="w-full h-48 object-cover transition-transform duration-200 hover:scale-110" /></div>}
                  <div className="p-4 flex-grow flex flex-col justify-between transition-all duration-200">
                    <h2 className="text-lg font-semibold text-[#3e2f25] truncate hover:text-[#5a4436] transition-colors duration-150">{product.title}</h2>
                    <p className="mt-2 font-bold text-[#5a4436] text-lg">${product.price.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <style jsx>{`
            .input { padding:0.5rem 0.75rem; border-radius:0.75rem; border:1px solid #ccc; transition:border 0.2s, box-shadow 0.2s; }
            .input:focus { outline:none; border-color:#5a4436; box-shadow:0 0 0 2px rgba(90,68,54,0.2); }
          `}</style>
        </div>
      </div>
    </Layout>
  );
}
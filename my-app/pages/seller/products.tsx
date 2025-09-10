// pages/seller/products.tsx
import Head from 'next/head'
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
  quantity: number;
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
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedEras, setSelectedEras] = useState<string[]>([]);

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

//Condition filter (multi-select)
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
    if (selectedConditions.length) query.conditions = selectedConditions.join(",");
  if (selectedEras.length) query.eras = selectedEras.join(",");
if (sortBy !== "relevance") query.sortBy = sortBy;
    const minPrice = Math.min(...products.map(p => p.price));
    const maxPrice = Math.max(...products.map(p => p.price));
    if (priceRange[0] !== minPrice) query.priceMin = String(priceRange[0]);
    if (priceRange[1] !== maxPrice) query.priceMax = String(priceRange[1]);
    router.replace({ pathname: router.pathname, query }, undefined, { shallow: true });
  }, [search, selectedColors, selectedSizes, selectedCategories, selectedConditions, selectedEras, sortBy, priceRange]);


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
  <title>My Products | Vintage Marketplace</title>
  <meta name="description" content="Manage and showcase your listed vintage items to potential buyers." />
</Head>
    <Layout categories={categories} user={user}>
      <div className="min-h-screen p-4 bg-[#fdf8f3] font-sans">
        <div className="max-w-5xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold text-[#3e2f25]">My Products</h1>
            <Link href="/seller/sell">
              <button className="px-4 py-2 bg-[#3e2f25] text-[#fdf8f3] rounded-lg hover:bg-[#5a4436] transition-all duration-150 active:scale-95 cursor-pointer">
                Add New Product
              </button>
            </Link>
          </div>

{/* Search Bar and Reset Filters: Always Visible */}
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
      // Reset state
      setSearch("");
      setSelectedColors([]);
      setSelectedSizes([]);
      setSelectedCategories([]);
      setSortBy("relevance");
      const prices = products.map(p => p.price);
      setPriceRange([Math.min(...prices), Math.max(...prices)]);

      // Reset URL query shallowly
      router.replace(
        { pathname: router.pathname, query: {} },
        undefined,
        { shallow: true }
      );
    }}
    className="px-4 py-2 bg-[#b58b5a] text-white rounded-xl hover:bg-[#d4b996] transition cursor-pointer"
  >
    Reset Filters
  </button>
</div>

          {/* Toggle Filters */}
          <button
  className="mb-4 px-4 py-2 bg-[#5a4436] text-white rounded-xl transition-all duration-200 transform hover:bg-[#3e2f25] hover:scale-105 hover:shadow-lg cursor-pointer"
  onClick={() => setFiltersVisible(prev => !prev)}
>
  {filtersVisible ? "Hide Filters" : "Show Filters"}
</button>

{/* Full Filters & Sorting Panel */}
{filtersVisible && (
  <div className="flex flex-col gap-6 mb-6 p-6 bg-[#fffdfb] rounded-3xl shadow-lg transition-all">

    {/* Sort & Price Section */}
    <div className="bg-white p-5 rounded-2xl shadow-md flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      
      {/* Sort By */}
      <div className="flex flex-col md:flex-row md:items-center gap-2">
        <span className="text-[#3e2f25] font-semibold">Sort By:</span>
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as SortOption)}
          className="input bg-white text-[#3e2f25] rounded-lg border border-gray-300 p-2 shadow-sm hover:shadow-md transition"
        >
          <option value="alpha">A → Z</option>
          <option value="alphaDesc">Z → A</option>
          <option value="priceAsc">Price ↑</option>
          <option value="priceDesc">Price ↓</option>
          <option value="relevance">Relevance</option>
        </select>
      </div>

      {/* Price Range */}
      <div className="flex flex-col md:flex-row md:items-center gap-2">
        <span className="text-[#3e2f25] font-semibold">Price Range:</span>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            value={priceRange[0]}
            min={0}
            onChange={e => handlePriceChange(e, 0)}
            className="input w-20 bg-white text-[#3e2f25] rounded-lg border border-gray-300 p-2 shadow-sm hover:shadow-md transition"
          />
          <span className="text-[#3e2f25] font-semibold">-</span>
          <input
            type="number"
            value={priceRange[1]}
            min={0}
            onChange={e => handlePriceChange(e, 1)}
            className="input w-20 bg-white text-[#3e2f25] rounded-lg border border-gray-300 p-2 shadow-sm hover:shadow-md transition"
          />
        </div>
      </div>

    </div>

    {/* Filters Section */}
    <div className="bg-white p-5 rounded-2xl shadow-md flex flex-col gap-6">

      {/* Colors */}
      <div className="flex flex-col gap-2">
        <h3 className="text-[#3e2f25] font-semibold text-lg">Colors</h3>
        <div className="flex flex-wrap gap-3">
          {/* All Circle */}
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

          {/* Color Circles */}
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
                className={`w-10 h-10 rounded-full border-2 transition-all duration-200 flex items-center justify-center
                  ${isSelected ? "border-[#3e2f25] scale-110 shadow-md" : "border-gray-300"}
                  hover:scale-110 hover:shadow-md cursor-pointer
                `}
                style={{ backgroundColor: c.toLowerCase() }}
              />
            );
          })}
        </div>
      </div>

      {/* Sizes */}
      <div className="flex flex-col gap-2">
        <h3 className="text-[#3e2f25] font-semibold text-lg">Sizes</h3>
        <div className="flex flex-wrap gap-3">
          {/* All Circle */}
          <button
            type="button"
            onClick={() => setSelectedSizes([])}
            className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-200
              ${selectedSizes.length === 0 ? "border-[#3e2f25] bg-[#fdf8f3]" : "border-gray-300 bg-white"}
              hover:scale-110 hover:shadow-md cursor-pointer
            `}
          >
            All
          </button>

          {/* Size Circles */}
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
      </div>


{/* Condition Filter */}
<div className="flex flex-col gap-4">
  <h3 className="text-[#3e2f25] font-semibold">Condition</h3>

  <div className="relative flex justify-between items-start w-full px-4 pt-2">
    {/* Base Line */}
    <div className="absolute top-3 left-0 w-full h-1 bg-gray-300 rounded"></div>

    {["Highly Damaged", "Slightly Damaged", "Fair", "Good", "Excellent"].map(cond => {
      const normalized = cond.toLowerCase().trim();
      const isSelected = selectedConditions.includes(normalized);

      return (
        <div
          key={cond}
          className="flex flex-col items-center relative z-10 text-center w-1/5 px-1 sm:px-2"
        >
          {/* Dot */}
          <button
            type="button"
            onClick={() => {
              if (isSelected) {
                setSelectedConditions(selectedConditions.filter(c => c !== normalized));
              } else {
                setSelectedConditions([...selectedConditions, normalized]);
              }
            }}
            className="rounded-full transition-all duration-300 cursor-pointer hover:scale-110"
            style={{
              width: isSelected ? "18px" : "14px",
              height: isSelected ? "18px" : "14px",
              backgroundColor: isSelected ? "#5a4436" : "#ffffff",
              border: isSelected ? "2px solid #5a4436" : "2px solid #9ca3af",
            }}
          ></button>

          {/* Label */}
          <span
            className={`text-xs mt-3 max-w-[80px] leading-tight break-words ${
              isSelected ? "font-bold text-[#3e2f25]" : "text-gray-600"
            }`}
          >
            {cond}
          </span>
        </div>
      );
    })}
  </div>
</div>

{/*Eras*/}
<div className="flex flex-col gap-2">
  <label className="text-gray-700 font-semibold">Era</label>
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
          className={`px-3 py-1 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-200
            ${isSelected ? "border-[#3e2f25] scale-110 shadow-md bg-[#fdf8f3]" : "border-gray-300 bg-white"}
            hover:scale-110 hover:shadow-md cursor-pointer
          `}
        >
          {era}
        </button>
      );
    })}
  </div>
</div>

      {/* Categories */}
      <div className="flex flex-col gap-2">
        <h3 className="text-[#3e2f25] font-semibold text-lg">Categories</h3>
        <div className="flex flex-col gap-2 max-h-64 overflow-y-auto bg-white p-3 rounded-2xl border shadow-sm">
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

{/* Products Grid */}
{filteredProducts.length === 0 ? (
  <p className="text-center text-[#3e2f25] font-medium mt-6 text-lg">
    No products found.
  </p>
) : (
  <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
    {filteredProducts.map((product) => (
      <Link
        key={product.id}
        href={`/seller/products/${product.id}`}
        className="group block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden
          transition-all duration-300 hover:shadow-lg hover:scale-105 cursor-pointer"
      >
        {/* Product Image */}
        {product.images[0] && (
          <div className="relative w-full h-56 lg:h-72 overflow-hidden rounded-t-2xl">
            <img
              src={product.images[0]}
              alt={product.title}
              className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 ${
                product.quantity === 0 ? "opacity-70" : ""
              }`}
            />

            {/* Sold Out Ribbon */}
            {product.quantity === 0 && (
              <div className="absolute top-2 left-0 bg-[#7b5b40] text-white text-xs font-bold px-3 py-1 rounded-br-lg transform -rotate-12 shadow-md z-10">
                Sold Out
              </div>
            )}
          </div>
        )}

        {/* Card Content */}
        <div className="p-4 flex flex-col items-center justify-center">
          <h2 className="text-sm md:text-base lg:text-lg font-semibold text-[#3e2f25] truncate text-center group-hover:text-[#5a4436] transition-colors duration-200">
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
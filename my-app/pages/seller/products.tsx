// pages/myproducts.tsx
import { prisma } from "../../lib/prisma";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import { GetServerSidePropsContext } from "next";
import { useState, useMemo, ChangeEvent } from "react";
import Layout from "../../components/header";

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  images: string[];
  colors: string[];
  sizes: string[];
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
}

interface MyProductsPageProps {
  products: Product[];
  categories: Category[];
  user: User;
}

type SortOption = "alpha" | "alphaDesc" | "priceAsc" | "priceDesc" | "relevance";

export default function MyProductsPage({ products, categories, user }: MyProductsPageProps) {
  const [search, setSearch] = useState("");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("relevance");
  const [priceRange, setPriceRange] = useState<[number, number]>(() => {
    const prices = products.map(p => p.price);
    return [Math.min(...prices), Math.max(...prices)];
  });

  const allColors = Array.from(new Set(products.flatMap(p => p.colors)));
  const allSizes = Array.from(new Set(products.flatMap(p => p.sizes)));

  const handlePriceChange = (e: ChangeEvent<HTMLInputElement>, index: 0 | 1) => {
    const val = Number(e.target.value);
    setPriceRange(prev => index === 0 ? [val, prev[1]] : [prev[0], val]);
  };

  const filteredProducts = useMemo(() => {
    let result = products
      .filter(p => p.price >= priceRange[0] && p.price <= priceRange[1])
      .filter(p => selectedColors.length === 0 || p.colors.some(c => selectedColors.includes(c)))
      .filter(p => selectedSizes.length === 0 || p.sizes.some(s => selectedSizes.includes(s)));

    if (search.trim() !== "") {
      const searchLower = search.toLowerCase();
      result = result.filter(p => p.title.toLowerCase().includes(searchLower));
    }

    switch (sortBy) {
      case "alpha":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "alphaDesc":
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "priceAsc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "priceDesc":
        result.sort((a, b) => b.price - a.price);
        break;
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
  }, [products, search, selectedColors, selectedSizes, sortBy, priceRange]);

  return (
    <Layout categories={categories} user={user}>
<div className="min-h-screen p-4 bg-[#fdf8f3] font-sans">
  <div className="max-w-5xl mx-auto">
    {/* Header */}
    <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-3">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#3e2f25]">
        My Products
      </h1>
      <Link href="/sell">
        <button className="px-4 py-2 bg-[#3e2f25] text-[#fdf8f3] rounded-lg hover:bg-[#5a4436] transition-all duration-150 active:scale-95">
          Add New Product
        </button>
      </Link>
    </div>

    {/* Filters */}
    <div className="flex flex-wrap gap-3 mb-6 items-center bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition">
      <input
        type="text"
        placeholder="Search by title..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input flex-grow min-w-[150px] bg-white text-[#3e2f25]"
      />

      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value as SortOption)}
        className="input bg-white text-[#3e2f25]"
      >
        <option value="alpha">A → Z</option>
        <option value="alphaDesc">Z → A</option>
        <option value="priceAsc">Price ↑</option>
        <option value="priceDesc">Price ↓</option>
        <option value="relevance">Relevance</option>
      </select>

      <div className="flex gap-2 items-center">
        <input
          type="number"
          value={priceRange[0]}
          min={0}
          onChange={(e) => handlePriceChange(e, 0)}
          className="input w-20 bg-white text-[#3e2f25]"
        />
        <span className="text-[#3e2f25]">-</span>
        <input
          type="number"
          value={priceRange[1]}
          min={0}
          onChange={(e) => handlePriceChange(e, 1)}
          className="input w-20 bg-white text-[#3e2f25]"
        />
      </div>

      <select
        multiple
        value={selectedColors}
        onChange={(e) =>
          setSelectedColors(Array.from(e.target.selectedOptions, (o) => o.value))
        }
        className="input flex-grow min-w-[100px] bg-white text-[#3e2f25]"
      >
        {allColors.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>

      <select
        multiple
        value={selectedSizes}
        onChange={(e) =>
          setSelectedSizes(Array.from(e.target.selectedOptions, (o) => o.value))
        }
        className="input flex-grow min-w-[100px] bg-white text-[#3e2f25]"
      >
        {allSizes.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
    </div>

    {/* Products Grid */}
    {filteredProducts.length === 0 ? (
      <p className="text-center text-[#3e2f25] font-medium mt-6">
        No products found.
      </p>
    ) : (
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredProducts.map((product) => (
          <Link
            key={product.id}
            href={`/admin/products/${product.id}`}
            className="block"
          >
            <div className="bg-[#fffdfb] rounded-2xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition h-[320px] flex flex-col">
              {product.images[0] && (
                <img
                  src={product.images[0]}
                  alt={product.title}
                  className="w-full h-48 object-cover"
                />
              )}
              <div className="p-3 flex-grow flex flex-col justify-between">
                <h2 className="text-lg font-semibold text-[#3e2f25] truncate">
                  {product.title}
                </h2>
                <p className="mt-2 font-bold text-[#5a4436]">
                  ${product.price.toFixed(2)}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    )}
  </div>

  {/* Input Styles */}
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
    </Layout>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session?.user?.id) {
    return { redirect: { destination: "/api/auth/signin", permanent: false } };
  }

  const products = await prisma.product.findMany({
    where: { ownerId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  const categories = await prisma.category.findMany({
    select: { id: true, title: true, order: true, parentId: true },
    orderBy: { order: "asc" },
  });

  return {
    props: {
      products: products.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      categories,
      user: { id: session.user.id, name: session.user.name || "Guest" },
    },
  };
}
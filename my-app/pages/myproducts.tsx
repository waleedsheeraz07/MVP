// pages/myproducts.tsx
import { prisma } from "../lib/prisma";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";
import { GetServerSidePropsContext } from "next";
import { useState, useMemo, ChangeEvent } from "react";

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  images: string[];
  colors: string[];
  sizes: string[];
}

interface MyProductsPageProps {
  products: Product[];
}

export default function MyProductsPage({ products }: MyProductsPageProps) {
  const [search, setSearch] = useState("");
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<"alpha" | "alphaDesc" | "priceAsc" | "priceDesc" | "relevance">("alpha");
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

    // Smart search and relevance
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
        // Smart relevance: exact match first, then startsWith, then includes
        const searchLower = search.toLowerCase();
        result.sort((a, b) => {
          const aTitle = a.title.toLowerCase();
          const bTitle = b.title.toLowerCase();
          const aScore = aTitle === searchLower ? 3 : aTitle.startsWith(searchLower) ? 2 : aTitle.includes(searchLower) ? 1 : 0;
          const bScore = bTitle === searchLower ? 3 : bTitle.startsWith(searchLower) ? 2 : bTitle.includes(searchLower) ? 1 : 0;
          return bScore - aScore;
        });
        break;
    }

    return result;
  }, [products, search, selectedColors, selectedSizes, sortBy, priceRange]);

  return (
    <div style={{ padding: "1rem", fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>My Products</h1>

      {/* Filters & Search */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem", alignItems: "center" }}>
        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: "0.5rem", minWidth: "150px", flexGrow: 1, borderRadius: "6px", border: "1px solid #ccc" }}
        />

        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as any)}
          style={{ padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc" }}
        >
          <option value="alpha">A → Z</option>
          <option value="alphaDesc">Z → A</option>
          <option value="priceAsc">Price ↑</option>
          <option value="priceDesc">Price ↓</option>
          <option value="relevance">Relevance</option>
        </select>

        <div style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
          <input
            type="number"
            value={priceRange[0]}
            min={0}
            onChange={e => handlePriceChange(e, 0)}
            style={{ width: "70px", padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc" }}
          />
          -
          <input
            type="number"
            value={priceRange[1]}
            min={0}
            onChange={e => handlePriceChange(e, 1)}
            style={{ width: "70px", padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc" }}
          />
        </div>

        <select
          multiple
          value={selectedColors}
          onChange={e => setSelectedColors(Array.from(e.target.selectedOptions, o => o.value))}
          style={{ minWidth: "100px", padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc", flexGrow: 1 }}
        >
          {allColors.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          multiple
          value={selectedSizes}
          onChange={e => setSelectedSizes(Array.from(e.target.selectedOptions, o => o.value))}
          style={{ minWidth: "100px", padding: "0.5rem", borderRadius: "6px", border: "1px solid #ccc", flexGrow: 1 }}
        >
          {allSizes.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 && <p>No products found.</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem" }}>
        {filteredProducts.map(product => (
          <Link key={product.id} href={`/products/${product.id}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{
              border: "1px solid #ddd",
              borderRadius: "10px",
              overflow: "hidden",
              padding: "0.5rem",
              cursor: "pointer",
              background: "#fff",
              transition: "0.2s"
            }}>
              {product.images[0] && (
                <img
                  src={product.images[0]}
                  alt={product.title}
                  style={{ width: "100%", height: "180px", objectFit: "cover", borderRadius: "6px" }}
                />
              )}
              <h2 style={{ margin: "0.5rem 0", fontSize: "1.1rem" }}>{product.title}</h2>
              <p style={{ margin: "0.25rem 0", fontWeight: "bold" }}>${product.price.toFixed(2)}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
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

  return {
    props: {
      products: products.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
    },
  };
}
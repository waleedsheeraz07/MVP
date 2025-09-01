// pages/myproducts.tsx
import { prisma } from "../lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";
import { GetServerSidePropsContext } from "next";
import { useState, useMemo } from "react";

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
  const [sortBy, setSortBy] = useState<"alpha" | "priceAsc" | "priceDesc">("alpha");
  const [priceRange, setPriceRange] = useState<[number, number]>(() => {
    const prices = products.map(p => p.price);
    return [Math.min(...prices), Math.max(...prices)];
  });

  const allColors = Array.from(new Set(products.flatMap(p => p.colors)));
  const allSizes = Array.from(new Set(products.flatMap(p => p.sizes)));

  const filteredProducts = useMemo(() => {
    return products
      .filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
      .filter(p => selectedColors.length === 0 || p.colors.some(c => selectedColors.includes(c)))
      .filter(p => selectedSizes.length === 0 || p.sizes.some(s => selectedSizes.includes(s)))
      .filter(p => p.price >= priceRange[0] && p.price <= priceRange[1])
      .sort((a, b) => {
        if (sortBy === "alpha") return a.title.localeCompare(b.title);
        if (sortBy === "priceAsc") return a.price - b.price;
        return b.price - a.price; // priceDesc
      });
  }, [products, search, selectedColors, selectedSizes, sortBy, priceRange]);

  const toggleFilter = (value: string, setFn: (vals: string[]) => void) => {
    setFn(prev => prev.includes(value) ? prev.filter(v => v !== value) : [...prev, value]);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>, index: 0 | 1) => {
    const val = Number(e.target.value);
    setPriceRange(prev => index === 0 ? [val, prev[1]] : [prev[0], val]);
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>My Products</h1>

      {/* Search & Filters */}
      <div style={{ marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: "0.5rem", width: "200px", marginRight: "1rem" }}
        />

        <label>Sort:</label>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={{ marginLeft: "0.5rem", marginRight: "1rem" }}>
          <option value="alpha">A → Z</option>
          <option value="priceAsc">Price ↑</option>
          <option value="priceDesc">Price ↓</option>
        </select>

        <label>Price:</label>
        <input
          type="number"
          value={priceRange[0]}
          min={0}
          onChange={e => handlePriceChange(e, 0)}
          style={{ width: "70px", margin: "0 0.25rem" }}
        />
        -
        <input
          type="number"
          value={priceRange[1]}
          min={0}
          onChange={e => handlePriceChange(e, 1)}
          style={{ width: "70px", margin: "0 0.25rem" }}
        />
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <strong>Colors:</strong>{" "}
        {allColors.map(color => (
          <button
            key={color}
            onClick={() => toggleFilter(color, setSelectedColors)}
            style={{
              margin: "0 0.25rem",
              padding: "0.25rem 0.5rem",
              background: selectedColors.includes(color) ? "#333" : "#eee",
              color: selectedColors.includes(color) ? "#fff" : "#000",
              border: "none",
              cursor: "pointer",
            }}
          >
            {color}
          </button>
        ))}
      </div>

      <div style={{ marginBottom: "1rem" }}>
        <strong>Sizes:</strong>{" "}
        {allSizes.map(size => (
          <button
            key={size}
            onClick={() => toggleFilter(size, setSelectedSizes)}
            style={{
              margin: "0 0.25rem",
              padding: "0.25rem 0.5rem",
              background: selectedSizes.includes(size) ? "#333" : "#eee",
              color: selectedSizes.includes(size) ? "#fff" : "#000",
              border: "none",
              cursor: "pointer",
            }}
          >
            {size}
          </button>
        ))}
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 && <p>No products found.</p>}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
        {filteredProducts.map(product => (
          <Link key={product.id} href={`/products/${product.id}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ border: "1px solid #ccc", borderRadius: "8px", overflow: "hidden", padding: "0.5rem", cursor: "pointer" }}>
              {product.images[0] && (
                <div style={{ position: "relative", width: "100%", height: "200px" }}>
                  <Image src={product.images[0]} alt={product.title} fill style={{ objectFit: "cover" }} />
                </div>
              )}
              <h2 style={{ margin: "0.5rem 0" }}>{product.title}</h2>
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
    return {
      redirect: {
        destination: "/api/auth/signin",
        permanent: false,
      },
    };
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
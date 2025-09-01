// pages/myproducts.tsx
import { prisma } from "../lib/prisma";
import Link from "next/link";
import Image from "next/image";
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
  const [sortBy, setSortBy] = useState<"alpha" | "priceAsc" | "priceDesc">("alpha");
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
    return products
      .filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
      .filter(p => selectedColors.length === 0 || p.colors.some(c => selectedColors.includes(c)))
      .filter(p => selectedSizes.length === 0 || p.sizes.some(s => selectedSizes.includes(s)))
      .filter(p => p.price >= priceRange[0] && p.price <= priceRange[1])
      .sort((a, b) => {
        switch (sortBy) {
          case "alpha": return a.title.localeCompare(b.title);
          case "priceAsc": return a.price - b.price;
          case "priceDesc": return b.price - a.price;
        }
      });
  }, [products, search, selectedColors, selectedSizes, sortBy, priceRange]);

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>My Products</h1>

      {/* Search and filters */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Search by title..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ padding: "0.5rem", minWidth: "200px" }}
        />

        <label>Sort:</label>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as "alpha" | "priceAsc" | "priceDesc")}>
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
          style={{ width: "70px" }}
        />
        -
        <input
          type="number"
          value={priceRange[1]}
          min={0}
          onChange={e => handlePriceChange(e, 1)}
          style={{ width: "70px" }}
        />

        <label>Colors:</label>
        <select
          multiple
          value={selectedColors}
          onChange={e => setSelectedColors(Array.from(e.target.selectedOptions, option => option.value))}
          style={{ minWidth: "120px" }}
        >
          {allColors.map(color => (
            <option key={color} value={color}>{color}</option>
          ))}
        </select>

        <label>Sizes:</label>
        <select
          multiple
          value={selectedSizes}
          onChange={e => setSelectedSizes(Array.from(e.target.selectedOptions, option => option.value))}
          style={{ minWidth: "120px" }}
        >
          {allSizes.map(size => (
            <option key={size} value={size}>{size}</option>
          ))}
        </select>
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
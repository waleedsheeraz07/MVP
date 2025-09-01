import { prisma } from "../lib/prisma";
import Link from "next/link";

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  images: string[];
  colors: string[];
  sizes: string[];
}

interface ProductsPageProps {
  products: Product[];
}

export default function ProductsPage({ products }: ProductsPageProps) {
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>All Products</h1>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
        {products.map(product => (
          <Link key={product.id} href={`/products/${product.id}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ border: "1px solid #ccc", borderRadius: "8px", overflow: "hidden", padding: "0.5rem", transition: "0.2s", cursor: "pointer" }}>
              {product.images[0] && (
                <img src={product.images[0]} alt={product.title} style={{ width: "100%", height: "200px", objectFit: "cover" }} />
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

// Fetch products at build time
export async function getStaticProps() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
  });

  // Serialize dates if needed
  const serialized = products.map(p => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return {
    props: { products: serialized },
    revalidate: 60, // rebuild page at most every 60s
  };
}
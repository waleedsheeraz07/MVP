// pages/myproducts.tsx
import { prisma } from "../lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";
import { GetServerSidePropsContext } from "next";

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
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>My Products</h1>
      {products.length === 0 && <p>You haven’t added any products yet.</p>}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
        {products.map(product => (
          <Link key={product.id} href={`/products/${product.id}`} style={{ textDecoration: "none", color: "inherit" }}>
            <div style={{ border: "1px solid #ccc", borderRadius: "8px", overflow: "hidden", padding: "0.5rem", transition: "0.2s", cursor: "pointer" }}>
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
import { prisma } from "../../../lib/prisma";
import { GetStaticPaths, GetStaticProps } from "next";

interface ProductDetailProps {
  product: {
    id: string;
    title: string;
    description?: string;
    price: number;
    images: string[];
    colors: string[];
    sizes: string[];
  };
}

export default function ProductDetail({ product }: ProductDetailProps) {
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>{product.title}</h1>
      <p style={{ fontWeight: "bold" }}>${product.price.toFixed(2)}</p>

      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", margin: "1rem 0" }}>
        {product.images.map((img, idx) => (
          <img key={idx} src={img} alt={`${product.title} ${idx}`} style={{ width: "300px", height: "300px", objectFit: "cover", borderRadius: "8px" }} />
        ))}
      </div>

      {product.description && <p>{product.description}</p>}

      {product.colors.length > 0 && (
        <p>
          <strong>Colors:</strong> {product.colors.join(", ")}
        </p>
      )}

      {product.sizes.length > 0 && (
        <p>
          <strong>Sizes:</strong> {product.sizes.join(", ")}
        </p>
      )}
    </div>
  );
}

// Build paths for all products
export const getStaticPaths: GetStaticPaths = async () => {
  const products = await prisma.product.findMany({
    select: { id: true },
  });

  const paths = products.map((p) => ({ params: { id: p.id } }));

  return {
    paths,
    fallback: "blocking", // build new pages if a new product is added
  };
};

// Fetch product data at build time
export const getStaticProps: GetStaticProps = async ({ params }) => {
  const id = params?.id as string;

  const product = await prisma.product.findUnique({
    where: { id },
  });

  if (!product) {
    return { notFound: true };
  }

  return {
    props: {
      product: {
        ...product,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      },
    },
    revalidate: 60, // rebuild page every 60 seconds if needed
  };
};
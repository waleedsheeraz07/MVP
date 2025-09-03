// pages/products/[id].tsx
import { prisma } from "../../lib/prisma";
import { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";

interface ProductDetailProps {
  product: {
    id: string;
    title: string;
    description?: string;
    price: number;
    images: string[];
    colors: string[];
    sizes: (string | null)[];
  };
}

export default function ProductDetail({ product }: ProductDetailProps) {
  const validSizes = product.sizes.filter((s) => s && s.trim() !== "");

  return (
    <div className="bg-[#fdf8f3] min-h-screen font-sans">
      {/* Image Slider full width */}
      <div className="w-full overflow-x-auto whitespace-nowrap scrollbar-hide">
        {product.images.map((img, idx) => (
          <img
            key={idx}
            src={img}
            alt={`${product.title} ${idx}`}
            className="inline-block w-full md:w-[600px] h-[400px] object-cover mr-2"
          />
        ))}
      </div>

      {/* Product Info Section */}
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl md:text-4xl font-bold text-[#3e2f25] mb-3">
          {product.title}
        </h1>
        <p className="text-2xl font-semibold text-[#5a4436] mb-6">
          ${product.price.toFixed(2)}
        </p>

        {product.description && (
          <p className="text-gray-700 leading-relaxed mb-6">
            {product.description}
          </p>
        )}

        {product.colors.length > 0 && (
          <div className="mb-4">
            <p className="font-semibold mb-2">Available Colors:</p>
            <div className="flex gap-2 flex-wrap">
              {product.colors.map((c, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full border bg-gray-100 text-sm text-gray-700"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}

        {validSizes.length > 0 && (
          <div className="mb-4">
            <p className="font-semibold mb-2">Available Sizes:</p>
            <div className="flex gap-2 flex-wrap">
              {validSizes.map((s, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full border bg-gray-100 text-sm text-gray-700"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <button className="flex-1 py-3 px-4 bg-[#4CAF50] text-white text-lg rounded-lg hover:bg-[#43a047] transition">
            Add to Cart
          </button>
          <button className="flex-1 py-3 px-4 bg-[#ff7043] text-white text-lg rounded-lg hover:bg-[#f4511e] transition">
            Add to Wishlist
          </button>
          <Link
            href="/products"
            className="flex-1 py-3 px-4 bg-gray-200 text-gray-800 text-lg text-center rounded-lg hover:bg-gray-300 transition"
          >
            Back to Products
          </Link>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
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
    fallback: "blocking",
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
    revalidate: 60,
  };
};
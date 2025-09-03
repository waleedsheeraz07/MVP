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
  // Filter sizes to remove null/empty values
  const validSizes = product.sizes.filter((s) => s && s.trim() !== "");

  return (
    <div className="min-h-screen bg-[#fdf8f3] font-sans p-4">
      <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-md p-6">
        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Image Slider */}
          <div className="overflow-x-auto whitespace-nowrap scrollbar-hide rounded-xl border">
            {product.images.map((img, idx) => (
              <img
                key={idx}
                src={img}
                alt={`${product.title} ${idx}`}
                className="inline-block w-full md:w-[400px] h-[400px] object-cover mr-2 rounded-xl"
              />
            ))}
          </div>

          {/* Product Info */}
          <div className="flex flex-col gap-4">
            <h1 className="text-2xl md:text-3xl font-bold text-[#3e2f25]">
              {product.title}
            </h1>
            <p className="text-xl font-semibold text-[#5a4436]">
              ${product.price.toFixed(2)}
            </p>

            {product.description && (
              <p className="text-gray-700 leading-relaxed">
                {product.description}
              </p>
            )}

            {/* Colors */}
            {product.colors.length > 0 && (
              <div>
                <p className="font-semibold mb-1">Available Colors:</p>
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

            {/* Sizes (only if valid) */}
            {validSizes.length > 0 && (
              <div>
                <p className="font-semibold mb-1">Available Sizes:</p>
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

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 mt-4">
              <button className="flex-1 py-2 px-4 bg-[#4CAF50] text-white rounded-lg hover:bg-[#43a047] transition">
                Add to Cart
              </button>
              <button className="flex-1 py-2 px-4 bg-[#ff7043] text-white rounded-lg hover:bg-[#f4511e] transition">
                Add to Wishlist
              </button>
              <Link
                href="/products"
                className="flex-1 py-2 px-4 bg-gray-200 text-gray-800 text-center rounded-lg hover:bg-gray-300 transition"
              >
                Back to Products
              </Link>
            </div>
          </div>
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
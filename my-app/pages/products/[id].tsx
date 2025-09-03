// pages/products/[id].tsx
import { prisma } from "../../lib/prisma";
import { GetStaticPaths, GetStaticProps } from "next";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import AdminHeader from '../../components/header'

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
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const handleScroll = () => {
      const index = Math.round(container.scrollLeft / container.clientWidth);
      setActiveIndex(index);
    };

    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const handleDotClick = (index: number) => {
    const container = scrollRef.current;
    if (!container) return;

    const scrollTo = index * container.clientWidth;
    container.scrollTo({ left: scrollTo, behavior: "smooth" });
    setActiveIndex(index);
  };

  return (
<>

      <AdminHeader title="Admin Panel" titleHref="/admin" />
      
    <div className="bg-[#fdf8f3] min-h-screen font-sans">
      {/* Image Slider */}
      <div className="relative w-full">
        {/* Back Arrow (sticky inside slider) */}
{/* Back Arrow (fixed, premium style with blur) */}
<Link
  href="/products"
  className="fixed top-4 left-4 z-50 
             bg-black/40 hover:bg-black/60 
             text-white p-2 rounded-full 
             backdrop-blur-sm transition"
>
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    className="w-6 h-6"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.75 19.5L8.25 12l7.5-7.5"
    />
  </svg>
</Link>

        {/* Image carousel */}
        <div
          className="overflow-x-auto whitespace-nowrap scrollbar-hide snap-x snap-mandatory"
          ref={scrollRef}
        >
          {product.images.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`${product.title} ${idx}`}
              className="inline-block w-full h-[400px] object-cover snap-center"
            />
          ))}
        </div>
      </div>

      {/* Dots indicator */}
      <div className="flex justify-center mt-3 gap-2">
        {product.images.map((_, i) => (
          <button
            key={i}
            onClick={() => handleDotClick(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === activeIndex ? "bg-[#3e2f25] w-4" : "bg-gray-400 w-2"
            }`}
          />
        ))}
      </div>

      {/* Product Info */}
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

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 mt-8">
          <button className="flex-1 py-3 px-4 bg-[#4CAF50] text-white text-lg rounded-lg hover:bg-[#43a047] transition">
            Add to Cart
          </button>
          <button className="flex-1 py-3 px-4 bg-[#ff7043] text-white text-lg rounded-lg hover:bg-[#f4511e] transition">
            Add to Wishlist
          </button>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
</>
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

// Fetch product data
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
// pages/buyer/products/[id].tsx
import { prisma } from "../../../lib/prisma";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]";
import Layout from "../../../components/header";
import { useCart } from "../../../context/CartContext";
import SwipeableGallery from "../../../components/SwipeableGallery";
import { useState, useRef } from "react";
import { useSwipeable } from "react-swipeable";

interface Category { id: string; title: string; order: number; parentId?: string | null; }
interface User { id: string; name?: string | null; role: string; }

interface ProductDetailProps {
  product: {
    id: string;
    title: string;
    description?: string;
    price: number;
    images: string[];
    colors: string[];
    sizes: (string | null)[];
    condition: string;
    era: string;
    quantity: number;
  };
  categories: Category[];
  user: User;
  session: { user?: { id: string; name?: string; email?: string } } | null;
}

export default function ProductDetail({ product, categories, user, session }: ProductDetailProps) {
  const validSizes = product.sizes.filter(s => s && s.trim() !== "");
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { refreshCart } = useCart();

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (validSizes.length === 1 && product.colors.length === 0) setSelectedSize(validSizes[0]);
    else if (product.colors.length === 1 && validSizes.length === 0) setSelectedColor(product.colors[0]);
    else if (validSizes.length === 1 && product.colors.length === 1) {
      setSelectedSize(validSizes[0]);
      setSelectedColor(product.colors[0]);
    }
  }, [validSizes, product.colors]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const handleScroll = () => setActiveIndex(Math.round(container.scrollLeft / container.clientWidth));
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const handleDotClick = (index: number) => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTo({ left: index * container.clientWidth, behavior: "smooth" });
    setActiveIndex(index);
  };

  const isAddToCartDisabled = () => {
    if (validSizes.length > 1 && !selectedSize) return true;
    if (product.colors.length > 1 && !selectedColor) return true;
    if (product.quantity === 0) return true; // disable if sold out
    return false;
  };

  const handleAddItem = async (status: "cart" | "wishlist") => {
    if (!session?.user?.id) {
      alert("You need to log in first");
      return;
    }
    if (status === "cart" && isAddToCartDisabled()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/useritem/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          productId: product.id,
          color: selectedColor,
          size: selectedSize,
          quantity: 1,
          status,
        }),
      });
      refreshCart();
      localStorage.setItem("cartUpdate", Date.now().toString());

      const data: { error?: string } = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add item");
      alert(status === "cart" ? "Product added to cart!" : "Product added to wishlist!");
    } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
      else alert("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout categories={categories} user={user}>

<div className="bg-[#fdf8f3] min-h-screen font-sans relative">
  {/* Back Button */}
  <Link
    href="/buyer/products"
    className="fixed top-[80px] left-4 z-[999] bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-sm transition"
  >
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
    </svg>
  </Link>

{/* Responsive Image Carousel with Full-Screen Mobile Gallery */}
<div className="flex flex-col lg:flex-row gap-6">
  {/* Thumbnails on desktop */}
  <div className="hidden lg:flex flex-col gap-2 lg:w-1/6">
    {product.images.map((img, idx) => (
      <img
        key={idx}
        src={img}
        alt={`${product.title} thumbnail ${idx}`}
        className={`h-20 w-20 object-cover cursor-pointer border rounded transition-all ${
          idx === activeIndex ? "border-[#5a4436] scale-105" : "border-gray-300"
        }`}
        onClick={() => setActiveIndex(idx)}
      />
    ))}
  </div>

  {/* Main image */}
  <div className="flex-1 relative">
    {/* Sold Out Ribbon */}
    {product.quantity === 0 && (
      <div className="absolute top-2 left-0 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-br-lg transform -rotate-12 shadow-lg z-10">
        Sold Out
      </div>
    )}

    {/* Main Image */}
    <img
      src={product.images[activeIndex]}
      alt={`${product.title} ${activeIndex}`}
      className="w-full h-[400px] object-cover rounded-lg cursor-pointer lg:cursor-auto"
      onClick={() => {
        if (window.innerWidth < 1024) setGalleryOpen(true);
      }}
    />

    {/* Carousel Dots for mobile */}
    <div className="flex lg:hidden justify-center mt-3 gap-2">
      {product.images.map((_, i) => (
        <button
          key={i}
          onClick={() => setActiveIndex(i)}
          className={`h-2 rounded-full transition-all duration-300 ${
            i === activeIndex ? "bg-[#3e2f25] w-4" : "bg-gray-400 w-2"
          }`}
        />
      ))}
    </div>
  </div>


    {/* Product Info */}
    <div className="flex-1 lg:w-1/2">
      <div className="p-6">
        <h1 className="text-3xl md:text-4xl font-bold text-[#3e2f25] mb-3">{product.title}</h1>
        <p className="text-2xl font-semibold text-[#5a4436] mb-4">${product.price.toFixed(2)}</p>
        {product.description && <p className="text-gray-700 leading-relaxed mb-4">{product.description}</p>}

        {/* Era */}
        <div className="mb-4 text-[#3e2f25] font-medium">
          <span><strong>Era:</strong> {product.era}</span>
        </div>

{/* Condition Bar */}
<div className="mb-10 mt-8">
  <p className="font-semibold mb-4">Condition:</p>

  {/* ⬇️ changed pt-6 → pt-1 to move dots up */}
  <div className="relative flex justify-between items-start w-full px-4 pt-1">
    {/* Base Line */}
    {/* ⬇️ changed top-5 → top-1 to align line closer to dots */}
    <div className="absolute top-2 left-0 w-full h-1 bg-gray-300 rounded"></div>

    {["Highly Damaged", "Slightly Damaged", "Fair", "Good", "Excellent"].map((cond) => {
      const isCurrent =
        cond.toLowerCase().trim() === product.condition.toLowerCase().trim();

      return (
        <div
          key={cond}
          // ⬇️ added px-1 sm:px-2 for spacing, and text-center stays for alignment
          className="flex flex-col items-center relative z-10 text-center w-1/5 px-1 sm:px-2"
        >
          {/* Dot */}
          <div
            className="rounded-full transition-all duration-300"
            style={{
              width: isCurrent ? "16px" : "14px",
              height: isCurrent ? "16px" : "14px",
              backgroundColor: isCurrent ? "#5a4436" : "#ffffff",
              border: isCurrent ? "2px solid #5a4436" : "2px solid #9ca3af",
            }}
          ></div>

          {/* Label */}
          {/* ⬇️ added text-center and bold for active condition */}
          <span
            className={`text-xs mt-3 max-w-[80px] leading-tight break-words text-center ${
              isCurrent ? "font-bold" : ""
            }`}
          >
            {cond}
          </span>
        </div>
      );
    })}
  </div>
</div>

    {/* Colors */}
    {product.colors.length > 0 && (
      <div className="mb-4">
        <p className="font-semibold mb-2">Available Colors:</p>
        <div className="flex gap-2 flex-wrap">
          {product.colors.map((c, i) => (
            <button
              key={i}
              onClick={() => setSelectedColor(c)}
              className={`px-3 py-1 rounded-full border text-sm transition ${
                selectedColor === c ? "bg-[#3e2f25] text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
    )}

    {/* Sizes */}
    {validSizes.length > 0 && (
      <div className="mb-4">
        <p className="font-semibold mb-2">Available Sizes:</p>
        <div className="flex gap-2 flex-wrap">
          {validSizes.map((s, i) => (
            <button
              key={i}
              onClick={() => setSelectedSize(s)}
              className={`px-3 py-1 rounded-full border text-sm transition ${
                selectedSize === s ? "bg-[#3e2f25] text-white" : "bg-gray-100 text-gray-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    )}

    {/* Action Buttons */}
    <div className="flex flex-col sm:flex-row gap-4 mt-8">
      <button
        disabled={isAddToCartDisabled() || loading}
        onClick={() => handleAddItem("cart")}
        className={`flex-1 py-3 px-4 text-lg rounded-lg transition ${
          isAddToCartDisabled() || loading
            ? "bg-gray-300 cursor-not-allowed text-gray-500"
            : "bg-[#5a4436] text-[#fdf8f3] hover:bg-[#3e2f25] hover:shadow-lg hover:scale-105"
        }`}
      >
        {loading ? "Adding..." : "Add to Cart"}
      </button>
      <button
        disabled={loading}
        onClick={() => handleAddItem("wishlist")}
        className="flex-1 py-3 px-4 bg-[#3e2f25] text-[#fdf8f3] hover:bg-[#5a4436] hover:shadow-lg hover:scale-105 text-lg rounded-lg transition"
      >
        {loading ? "Adding..." : "Add to Wishlist"}
      </button>
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
{/* Full-screen mobile gallery */}
{galleryOpen && (
  <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
    <button
      className="absolute top-4 right-4 text-white text-2xl z-50"
      onClick={() => setGalleryOpen(false)}
    >
      &times;
    </button>

    <SwipeableGallery
      images={product.images}
      activeIndex={activeIndex}
      setActiveIndex={setActiveIndex}
    />
  </div>
)}
    </Layout>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  const { id } = context.params as { id: string };

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return { notFound: true };

  const categories = await prisma.category.findMany({
    select: { id: true, title: true, order: true, parentId: true },
    orderBy: { order: "asc" },
  });

  return {
    props: {
      product: {
        ...product,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      },
      categories,
      user: session?.user
        ? { id: session.user.id, name: session.user.name || "Guest", role: session.user.role }
        : { id: "", name: "Guest" },
      session,
    },
  };
}
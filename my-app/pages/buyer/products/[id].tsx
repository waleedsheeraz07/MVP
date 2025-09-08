// pages/buyer/products/[id].tsx
import { prisma } from "../../../lib/prisma";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]";
import Layout from "../../../components/header";
import { useCart } from "../../../context/CartContext";

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

  {/* Image carousel */}
  <div className="overflow-x-auto whitespace-nowrap scrollbar-hide snap-x snap-mandatory relative" ref={scrollRef}>
    {product.images.map((img, idx) => (
      <img
        key={idx}
        src={img}
        alt={`${product.title} ${idx}`}
        className="inline-block w-full h-[400px] object-cover snap-center"
      />
    ))}

    {/* Sold Out Ribbon */}
    {product.quantity === 0 && (
      <div className="absolute top-2 left-0 bg-red-600 text-white text-xs font-bold px-3 py-1 rounded-br-lg transform -rotate-12 shadow-lg z-10">
        Sold Out
      </div>
    )}
  </div>

  {/* Carousel Dots */}
  <div className="flex justify-center mt-3 gap-2">
    {product.images.map((_, i) => (
      <button
        key={i}
        onClick={() => handleDotClick(i)}
        className={`h-2 rounded-full transition-all duration-300 ${i === activeIndex ? "bg-[#3e2f25] w-4" : "bg-gray-400 w-2"}`}
      />
    ))}
  </div>

  {/* Product Info */}
  <div className="max-w-4xl mx-auto p-6">
    <h1 className="text-3xl md:text-4xl font-bold text-[#3e2f25] mb-3">{product.title}</h1>
    <p className="text-2xl font-semibold text-[#5a4436] mb-4">${product.price.toFixed(2)}</p>
    {product.description && <p className="text-gray-700 leading-relaxed mb-4">{product.description}</p>}

    {/* Era */}
    <div className="mb-4 text-[#3e2f25] font-medium">
      <span><strong>Era:</strong> {product.era}</span>
    </div>

{/* Condition Bar */}
<div className="mb-6">
  <p className="font-semibold mb-4">Condition:</p>

  <div className="relative flex items-center justify-between w-full">
    {/* Base Line */}
    <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-300 -translate-y-1/2 rounded"></div>

    {["Highly Damaged", "Slightly Damaged", "Fair", "Good", "Excellent"].map((cond, idx) => {
      const isCurrent = cond === product.condition;

      return (
        <div key={cond} className="flex flex-col items-center relative z-10 w-1/5">
          {/* Dot */}
          <div
            className={`rounded-full border-2 transition-all duration-300 ${
              isCurrent
                ? "w-6 h-6 bg-[#5a4436] border-[#5a4436]" // highlighted
                : "w-4 h-4 bg-white border-gray-400" // normal
            }`}
          ></div>
          {/* Label */}
          <span className="text-xs mt-2 text-center text-[#3e2f25]">{cond}</span>
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

  <style jsx>{`
    .scrollbar-hide::-webkit-scrollbar {
      display: none;
    }
  `}</style>
</div>
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
// pages/buyer/products/[id].tsx
import Head from 'next/head'
import { prisma } from "../../../lib/prisma";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]";
import Layout from "../../../components/header";
import { useCart } from "../../../context/CartContext";
import SwipeableGallery from "../../../components/SwipeableGallery";
import { useSwipeable } from "react-swipeable";
import { showToast } from "../../../utils/toast";

interface Category { id: string; title: string; order: number; parentId?: string | null; }
interface User { id: string; name?: string | null; role: string; }

interface Product {
  id: string
  title: string
  description?: string
  price: number
  quantity: number
  images: string[]
}

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
  products: Product[];
}

export default function ProductDetail({ product, categories, user, session, products }: ProductDetailProps) {
 const [galleryOpen, setGalleryOpen] = useState(false);
 const validSizes = product.sizes.filter(s => s && s.trim() !== "");
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { refreshCart } = useCart();

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);


// inside your component
useEffect(() => {
  if (galleryOpen) {
    document.body.style.overflow = "hidden"; // disable scroll
  } else {
    document.body.style.overflow = ""; // restore scroll
  }

  return () => {
    document.body.style.overflow = ""; // cleanup just in case
  };
}, [galleryOpen]);


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
      showToast("You need to log in first");
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
      showToast(status === "cart" ? "Product added to cart!" : "Product added to wishlist!");
 } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
      else showToast("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };



const carouselHandlers = useSwipeable({
  onSwipedLeft: () => {
    if (activeIndex < product.images.length - 1) setActiveIndex(activeIndex + 1);
  },
  onSwipedRight: () => {
    if (activeIndex > 0) setActiveIndex(activeIndex - 1);
  },
  preventScrollOnSwipe: true, // ✅ replaces preventDefaultTouchmoveEvent
  trackMouse: true, // optional: allow mouse dragging on desktop
});

return (
  <>
    <Head>
      <title>{product?.title || "Vintage Treasure"} | Vintage Marketplace</title>
      <meta name="description" content={`Discover ${product?.title || "this authentic vintage piece"} - carefully curated with guaranteed authenticity.`} />
    </Head>
    
    <Layout categories={categories} user={user}>
      <div className="min-h-screen bg-[#fefaf5] font-sans">
        {/* Back Button */}
        {!galleryOpen && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
            <Link
              href="/buyer/products"
              className="inline-flex items-center space-x-2 text-[#8b4513] hover:text-[#6b3410] transition-colors duration-300 group"
            >
              <svg className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span className="font-medium">Back to All Treasures</span>
            </Link>
          </div>
        )}

        {/* Main Product Section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
            {/* Image Gallery Section */}
            <div className="flex-1">
              <div className="flex flex-col lg:flex-row gap-6">
                {/* Thumbnails - Desktop */}
                <div className="hidden lg:flex flex-col gap-4 order-2 lg:order-1">
                  {product.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveIndex(idx)}
                      className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all duration-300 cursor-pointer ${
                        idx === activeIndex 
                          ? "border-[#8b4513] scale-110 shadow-lg" 
                          : "border-[#e6d9c6] hover:border-[#d4b996] hover:scale-105"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`${product.title} thumbnail ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>

                {/* Main Image */}
                <div className="flex-1 order-1 lg:order-2">
                  <div {...carouselHandlers} className="relative">
                    {/* Sold Out Badge */}
                    {product.quantity === 0 && (
                      <div className="absolute top-4 left-4 bg-[#8b4513] text-white px-4 py-2 rounded-full text-sm font-bold transform -rotate-12 shadow-lg z-5">
                        Sold Out
                      </div>
                    )}

                    <div 
                      className="relative rounded-2xl overflow-hidden shadow-lg cursor-pointer group"
                      onClick={() => {
                        if (window.innerWidth < 1024) setGalleryOpen(true);
                      }}
                    >
                      <img
                        src={product.images[activeIndex]}
                        alt={product.title}
                        className="w-full h-96 sm:h-[500px] lg:h-[600px] object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      
                      {/* Quick View Overlay */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <span className="bg-white/90 text-[#8b4513] px-4 py-2 rounded-full font-semibold">
                          Tap to View Gallery
                        </span>
                      </div>
                    </div>

                    {/* Carousel Dots - Mobile */}
                    <div className="flex lg:hidden justify-center mt-4 gap-2">
                      {product.images.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveIndex(i)}
                          className={`h-2 rounded-full transition-all duration-300 ${
                            i === activeIndex ? "bg-[#8b4513] w-6" : "bg-[#d4b996] w-2"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Info Section */}
            <div className="flex-1 lg:max-w-md">
              <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
                {/* Title and Price */}
                <div className="mb-6">
                  <h1 className="text-3xl sm:text-4xl font-bold text-[#3e2f25] mb-4 leading-tight">
                    {product.title}
                  </h1>
                  <div className="flex items-center justify-between">
                    <span className="text-3xl font-bold text-[#8b4513]">
                      KWD {product.price.toFixed(2)}
                    </span>
                    {product.quantity > 0 && (
                      <span className="text-sm text-[#5a4436] bg-[#fdf8f3] px-3 py-1 rounded-full">
                        {product.quantity} in stock
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                {product.description && (
                  <div className="mb-6">
                    <p className="text-[#5a4436] leading-relaxed text-lg">
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Era */}
                <div className="mb-6">
                  <div className="flex items-center space-x-2 text-[#3e2f25]">
                    <span className="font-semibold">Era:</span>
                    <span className="text-lg">{product.era}</span>
                  </div>
                </div>

                {/* Condition */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-[#3e2f25] mb-4">Condition</h3>
                  <div className="space-y-3">
                    {["Excellent", "Good", "Fair", "Slightly Damaged", "Highly Damaged"].map((cond) => {
                      const isCurrent = cond.toLowerCase().trim() === product.condition.toLowerCase().trim();
                      return (
                        <div
                          key={cond}
                          className={`w-full px-4 py-3 rounded-xl transition-all duration-300 ${
                            isCurrent 
                              ? "bg-[#8b4513] text-white shadow-md transform scale-105" 
                              : "bg-[#fdf8f3] text-[#3e2f25]"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{cond}</span>
                            {isCurrent && (
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Colors */}
                {product.colors.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold text-[#3e2f25] mb-3">Available Colors</h3>
                    <div className="flex flex-wrap gap-3">
                      {product.colors.map((c, i) => (
                        <button
                          key={i}
                          onClick={() => setSelectedColor(c)}
                          className={`px-4 py-2 rounded-full border-2 font-medium transition-all duration-300 ${
                            selectedColor === c 
                              ? "border-[#8b4513] bg-[#fdf8f3] text-[#8b4513] scale-110 shadow-md" 
                              : "border-gray-300 bg-white text-[#3e2f25] hover:scale-105"
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
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-[#3e2f25] mb-3">Available Sizes</h3>
                    <div className="flex flex-wrap gap-3">
                      {validSizes.map((s, i) => {
                        const isSelected = selectedSize === s;
                        return (
                          <button
                            key={i}
                            onClick={() => setSelectedSize(s)}
                            className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all duration-300 ${
                              isSelected 
                                ? "border-[#8b4513] scale-110 shadow-md bg-[#fdf8f3]" 
                                : "border-gray-300 bg-white hover:scale-105"
                            } cursor-pointer`}
                          >
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    disabled={isAddToCartDisabled() || loading}
                    onClick={() => handleAddItem("cart")}
                    className={`flex-1 py-4 rounded-xl font-bold transition-all duration-300 ${
                      isAddToCartDisabled() || loading
                        ? "bg-gray-300 cursor-not-allowed text-gray-500 transform-none"
                        : "bg-[#8b4513] text-white hover:bg-[#6b3410] transform hover:scale-105 shadow-lg hover:shadow-xl"
                    }`}
                  >
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Adding...</span>
                      </div>
                    ) : (
                      "Add to Cart"
                    )}
                  </button>
                  
                  <button
                    disabled={loading}
                    onClick={() => handleAddItem("wishlist")}
                    className="flex-1 py-4 bg-transparent border-2 border-[#8b4513] text-[#8b4513] rounded-xl font-bold hover:bg-[#8b4513] hover:text-white transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? "Adding..." : "Add to Wishlist"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Products Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center mb-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-[#3e2f25] mb-4">
                More Vintage Treasures
              </h2>
              <p className="text-lg text-[#5a4436] max-w-2xl mx-auto">
                Discover other authentic pieces from our curated collection
              </p>
            </div>

            {products.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-[#5a4436] text-lg">No other treasures available at the moment.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
                {products.slice(0, 4).map((product) => (
                  <Link
                    key={product.id}
                    href={`/buyer/products/${product.id}`}
                    className="group block bg-white rounded-2xl shadow-lg overflow-hidden transition-all duration-500 hover:shadow-2xl hover:scale-105 cursor-pointer"
                  >
                    {/* Product Image */}
                    <div className="relative w-full h-64 sm:h-72 overflow-hidden">
                      {product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${
                            product.quantity === 0 ? "opacity-70 grayscale" : ""
                          }`}
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-[#e6d9c6] to-[#d4b996] flex items-center justify-center">
                          <span className="text-[#5a4436] text-sm font-medium">Image Coming Soon</span>
                        </div>
                      )}

                      {/* Sold Out Overlay */}
                      {product.quantity === 0 && (
                        <>
                          <div className="absolute inset-0 bg-black/50"></div>
                          <div className="absolute top-3 left-3 bg-[#8b4513] text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                            Sold Out
                          </div>
                        </>
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="p-4 sm:p-6">
                      <h3 className="text-lg font-bold text-[#3e2f25] mb-3 line-clamp-2 group-hover:text-[#8b4513] transition-colors duration-300">
                        {product.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold text-[#8b4513]">
                          KWD {product.price.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Full-screen Mobile Gallery */}
      {galleryOpen && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-3xl z-50 flex items-center justify-center overflow-hidden">
          <SwipeableGallery
            images={product.images}
            activeIndex={activeIndex}
            setActiveIndex={setActiveIndex}
            closeGallery={() => setGalleryOpen(false)}
          />
        </div>
      )}
    </Layout>
  </>
);

}

export async function getServerSideProps(context: GetServerSidePropsContext) {
 

 const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      images: true,
    },
  })

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
      products,
    },
  };
}
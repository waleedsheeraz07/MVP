// pages/buyer/cart.tsx:
import Head from 'next/head'
import { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import { prisma } from "../../lib/prisma";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { useCart } from "../../context/CartContext";
import Layout from "../../components/header";

interface CartItem {
  id: string;
  product: {
    id: string;
    title: string;
    price: number;
    images: string[];
    quantity: number; // stock
  };
  color: string | null;
  size: string | null;
  quantity: number; // quantity in cart
}

interface Category {
  id: string;
  title: string;
  order: number;
  parentId?: string | null;
}

interface User {
  id: string;
  name?: string | null;
  role: string;
}

interface CartPageProps {
  cartItems: CartItem[];
  categories: Category[];
  user: User;
}

export default function CartPage({ cartItems: initialCartItems, categories, user }: CartPageProps) {
  const [cart, setCart] = useState<CartItem[]>(initialCartItems);
  const [loadingIds, setLoadingIds] = useState<string[]>([]);
  const router = useRouter();
  const { refreshCart, setUserId } = useCart();

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Initialize CartContext with userId
  useEffect(() => {
    if (user?.id) {
      setUserId(user.id);
      refreshCart();
    }
  }, [user?.id, setUserId, refreshCart]);

  // Fetch latest cart from server
  const fetchLatestCart = useCallback(async () => {
    try {
      const res = await fetch("/api/useritem/cart-refresh");
      if (!res.ok) return;
      const latestCart: CartItem[] = await res.json();
      setCart(latestCart);
    } catch (err) {
      console.error("Failed to fetch latest cart", err);
    }
  }, []);

  // Cross-tab listener
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "cartUpdate") {
        fetchLatestCart();
        refreshCart();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [fetchLatestCart, refreshCart]);

  const handleQuantityChange = async (itemId: string, newQty: number) => {
    const item = cart.find((i) => i.id === itemId);
    if (!item || newQty < 1 || newQty > item.product.quantity) return;

    setCart((prev) => prev.map((i) => (i.id === itemId ? { ...i, quantity: newQty } : i)));
    setLoadingIds((prev) => [...prev, itemId]);

    try {
      const res = await fetch("/api/useritem/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, quantity: newQty }),
      });
      if (!res.ok) throw new Error("Failed to update quantity");

      localStorage.setItem("cartUpdate", Date.now().toString());
      refreshCart();
    } catch {
      alert("Failed to update quantity");
    } finally {
      setLoadingIds((prev) => prev.filter((id) => id !== itemId));
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setCart((prev) => prev.filter((i) => i.id !== itemId));
    setLoadingIds((prev) => [...prev, itemId]);

    try {
      const res = await fetch("/api/useritem/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      if (!res.ok) throw new Error("Failed to remove item");

      localStorage.setItem("cartUpdate", Date.now().toString());
      refreshCart();
    } catch {
      alert("Failed to remove item");
    } finally {
      setLoadingIds((prev) => prev.filter((id) => id !== itemId));
    }
  };

return (
  <>
    <Head>
      <title>Your Vintage Cart | Vintage Marketplace</title>
      <meta name="description" content="Review and manage your selected vintage treasures before checkout. Authentic pieces await." />
    </Head>
    
    <Layout categories={categories} user={user}>
      <div className="min-h-screen bg-[#fefaf5] py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#3e2f25] mb-4">
              Your Vintage Cart
            </h1>
            <p className="text-lg text-[#5a4436] max-w-2xl mx-auto">
              Review your selected treasures. Each piece tells a unique story.
            </p>
          </div>

          {/* Empty State */}
          {cart.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-[#e6d9c6] rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-[#8b4513]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#3e2f25] mb-2">Your cart is empty</h3>
              <p className="text-[#5a4436] mb-6">Discover timeless vintage pieces to add to your collection</p>
              <Link href="/buyer/products">
                <a className="inline-flex items-center space-x-2 px-8 py-3 bg-[#8b4513] text-white rounded-xl font-semibold hover:bg-[#6b3410] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                  <span>Explore Vintage Treasures</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </Link>
            </div>
          ) : (
            /* Cart Items */
            <div className="space-y-6">
              {cart.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-500 hover:scale-105"
                >
                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    disabled={loadingIds.includes(item.id)}
                    className="absolute top-4 right-4 bg-white/80 hover:bg-red-50 text-gray-400 hover:text-red-500 p-2 rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-110 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Remove from cart"
                  >
                    {loadingIds.includes(item.id) ? (
                      <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                  </button>

                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Product Image */}
                    <div
                      onClick={() => router.push(`/buyer/products/${item.product.id}`)}
                      className="flex-shrink-0 cursor-pointer transform transition-transform duration-300 hover:scale-105"
                    >
                      <div className="relative w-32 h-32 sm:w-40 sm:h-40 rounded-xl overflow-hidden shadow-lg">
                        <img
                          src={item.product.images[0]}
                          alt={item.product.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        {/* Quick View Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                          <span className="bg-white/90 text-[#8b4513] px-3 py-1 rounded-full text-sm font-semibold">
                            View Details
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 flex flex-col justify-between min-w-0">
                      <div>
                        <h2 
                          onClick={() => router.push(`/buyer/products/${item.product.id}`)}
                          className="text-xl font-bold text-[#3e2f25] mb-3 line-clamp-2 cursor-pointer hover:text-[#8b4513] transition-colors duration-300"
                        >
                          {item.product.title}
                        </h2>
                        
                        {/* Color and Size */}
                        {(item.color || item.size) && (
                          <div className="flex flex-wrap gap-3 mb-4">
                            {item.color && (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-[#5a4436] font-medium">Color:</span>
                                <span className="px-3 py-1 bg-[#fdf8f3] text-[#3e2f25] rounded-full text-sm border border-[#e6d9c6]">
                                  {item.color}
                                </span>
                              </div>
                            )}
                            {item.size && (
                              <div className="flex items-center space-x-2">
                                <span className="text-sm text-[#5a4436] font-medium">Size:</span>
                                <span className="px-3 py-1 bg-[#fdf8f3] text-[#3e2f25] rounded-full text-sm border border-[#e6d9c6]">
                                  {item.size}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Quantity and Price */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#e6d9c6]">
                        {/* Quantity Controls */}
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-3 bg-[#fdf8f3] rounded-xl p-2">
                            <button
                              disabled={loadingIds.includes(item.id) || item.quantity <= 1}
                              onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                              className="w-8 h-8 bg-white border border-[#e6d9c6] text-[#3e2f25] rounded-lg flex items-center justify-center hover:bg-[#e6d9c6] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                              </svg>
                            </button>
                            
                            <span className="font-bold text-[#3e2f25] min-w-[32px] text-center text-lg">
                              {item.quantity}
                            </span>
                            
                            <button
                              disabled={loadingIds.includes(item.id) || item.quantity >= item.product.quantity}
                              onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                              className="w-8 h-8 bg-white border border-[#e6d9c6] text-[#3e2f25] rounded-lg flex items-center justify-center hover:bg-[#e6d9c6] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>

                          {/* Stock Indicator */}
                          {item.product.quantity > 0 && (
                            <span className="text-sm text-[#5a4436]">
                              {item.product.quantity} in stock
                            </span>
                          )}
                        </div>

                        {/* Price */}
                        <div className="flex items-center space-x-4">
                          <span className="text-2xl font-bold text-[#8b4513]">
                            KWD {(item.product.price * item.quantity).toFixed(2)}
                          </span>
                          {item.product.quantity === 0 && (
                            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                              Sold Out
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* Checkout Section */}
              <div className="bg-white rounded-2xl shadow-lg p-6 mt-8">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
                  <div className="text-center sm:text-left">
                    <p className="text-lg text-[#5a4436]">Total for {cart.length} {cart.length === 1 ? 'item' : 'items'}</p>
                    <p className="text-3xl font-bold text-[#8b4513]">
                      KWD {total.toFixed(2)}
                    </p>
                  </div>
                  
                  <button
                    onClick={() => router.push("/buyer/checkout")}
                    disabled={cart.length === 0}
                    className="flex items-center space-x-3 px-8 py-4 bg-[#8b4513] text-white rounded-xl font-bold hover:bg-[#6b3410] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span className="text-lg">Proceed to Checkout</span>
                  </button>
                </div>

                {/* Continue Shopping */}
                <div className="text-center mt-6 pt-6 border-t border-[#e6d9c6]">
                  <Link href="/buyer/products">
                    <a className="inline-flex items-center space-x-2 text-[#8b4513] hover:text-[#6b3410] transition-colors duration-300 font-medium">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      <span>Continue Shopping</span>
                    </a>
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  </>
);

}

// ✅ Server-side fetch
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  // Only fetch cart if logged in
  const cartItems = session
    ? await prisma.userItem.findMany({
        where: { userId: session.user.id, status: "cart" },
        include: { product: true },
      })
    : [];

  const categories = await prisma.category.findMany({
    select: { id: true, title: true, order: true, parentId: true },
    orderBy: { order: "asc" },
  });

  return {
    props: {
      cartItems: cartItems.map((i) => ({
        ...i,
        product: { ...i.product, quantity: i.product.quantity ?? 0 },
      })),
      categories,
      user: {
        id: session?.user?.id ?? "Guest",
        name: session?.user?.name ?? "Guest",
        role: session?.user?.role ?? "Guest",
      },
    },
  };
}

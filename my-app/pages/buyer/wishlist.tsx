// pages/buyer/wishlist.tsx
import Head from 'next/head'
import { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import { prisma } from "../../lib/prisma";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/header";
import { useCart } from "../../context/CartContext";
  
interface WishlistItem {
  id: string;
  product: {
    id: string;
    title: string;
    price: number;
    images: string[];
    quantity: number;
  };
  color: string | null;
  size: string | null;
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

interface WishlistPageProps {
  wishlistItems: WishlistItem[];
  categories: Category[];
  user: User;
}

export default function WishlistPage({ wishlistItems: initialItems, categories, user }: WishlistPageProps) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>(initialItems);
  const [loadingIds, setLoadingIds] = useState<string[]>([]);
  const router = useRouter();
  const { refreshCart, setUserId } = useCart();

  const handleRemoveItem = async (itemId: string) => {
    setLoadingIds((prev) => [...prev, itemId]);
    setWishlist((prev) => prev.filter((i) => i.id !== itemId));

    try {
      const res = await fetch("/api/useritem/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      if (!res.ok) throw new Error("Failed to remove item");
    } catch {
      alert("Failed to remove item");
    } finally {
      setLoadingIds((prev) => prev.filter((id) => id !== itemId));
    }
  };

  const handleMoveToCart = async (item: WishlistItem) => {
    setLoadingIds((prev) => [...prev, item.id]);
    setWishlist((prev) => prev.filter((i) => i.id !== item.id));

    try {
      const res = await fetch("/api/useritem/move-to-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id }),
      });
      if (!res.ok) throw new Error("Failed to move to cart");
      localStorage.setItem("cartUpdate", Date.now().toString());
      refreshCart();
    } catch {
      alert("Failed to move item to cart");
    } finally {
      setLoadingIds((prev) => prev.filter((id) => id !== item.id));
    }
  };

return (
  <>
    <Head>
      <title>Your Vintage Wishlist | Vintage Marketplace</title>
      <meta name="description" content="Save your favorite vintage treasures and revisit them anytime. Curate your personal collection of timeless pieces." />
    </Head>
    
    <Layout categories={categories} user={user}>
      <div className="min-h-screen bg-[#fefaf5] py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#3e2f25] mb-4">
              Your Vintage Wishlist
            </h1>
            <p className="text-lg text-[#5a4436] max-w-2xl mx-auto">
              Curate your collection of timeless treasures. Save pieces that speak to you.
            </p>
          </div>

          {/* Empty State */}
          {wishlist.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-[#e6d9c6] rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-[#8b4513]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#3e2f25] mb-2">Your wishlist is empty</h3>
              <p className="text-[#5a4436] mb-6">Start building your collection of vintage treasures</p>
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
            /* Wishlist Items */
            <div className="space-y-6">
              {wishlist.map((item) => (
                <div
                  key={item.id}
                  className="group relative bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-500 hover:scale-105"
                >
                  {/* Remove Button */}
                  <button
                    onClick={() => handleRemoveItem(item.id)}
                    disabled={loadingIds.includes(item.id)}
                    className="absolute top-4 right-4 bg-white/80 hover:bg-red-50 text-gray-400 hover:text-red-500 p-2 rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-110 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Remove from wishlist"
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
                      onClick={() => router.push(`/products/${item.product.id}`)}
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
                          onClick={() => router.push(`/products/${item.product.id}`)}
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

                      {/* Price and Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[#e6d9c6]">
                        <div className="flex items-center space-x-4">
                          <span className="text-2xl font-bold text-[#8b4513]">
                            KWD {item.product.price.toFixed(2)}
                          </span>
                          {item.product.quantity === 0 && (
                            <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm font-medium">
                              Sold Out
                            </span>
                          )}
                        </div>
                        
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleMoveToCart(item)}
                            disabled={loadingIds.includes(item.id) || item.product.quantity === 0}
                            className="flex items-center space-x-2 px-6 py-3 bg-[#8b4513] text-white rounded-xl font-semibold hover:bg-[#6b3410] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                          >
                            {loadingIds.includes(item.id) ? (
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Moving...</span>
                              </div>
                            ) : (
                              <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                                <span>Add to Cart</span>
                              </>
                            )}
                          </button>
                          
                          <button
                            onClick={() => router.push(`/buyer/products/${item.product.id}`)}
                            className="flex items-center space-x-2 px-6 py-3 bg-transparent border-2 border-[#8b4513] text-[#8b4513] rounded-xl font-semibold hover:bg-[#8b4513] hover:text-white transform hover:scale-105 transition-all duration-300"
                          >
                            <span>View Details</span>
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Wishlist Summary */}
          {wishlist.length > 0 && (
            <div className="mt-12 text-center">
              <div className="bg-white rounded-2xl shadow-lg p-6 inline-block">
                <p className="text-lg text-[#3e2f25]">
                  You have <span className="font-bold text-[#8b4513]">{wishlist.length}</span> 
                  {wishlist.length === 1 ? ' vintage treasure' : ' vintage treasures'} saved
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  </>
);

}

// Server-side fetch
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  // Fetch wishlist only if logged in
  const wishlistItems = session
    ? await prisma.userItem.findMany({
        where: { userId: session.user.id, status: "wishlist" },
        include: { product: true },
      })
    : [];

  // Fetch categories
  const categories = await prisma.category.findMany({
    select: { id: true, title: true, order: true, parentId: true },
    orderBy: { order: "asc" },
  });

  return {
    props: {
      wishlistItems: wishlistItems.map((i) => ({
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

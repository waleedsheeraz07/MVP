// pages/wishlist.tsx
import { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";
import { prisma } from "../lib/prisma";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/router";
import Layout from "../components/header"; // collapsible sidebar layout
    
 interface WishlistItem {
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
}

interface WishlistPageProps {
  wishlistItems: WishlistItem[];
  categories: Category[];
  user: User;
}

export default function WishlistPage({ wishlistItems: initialItems, categories, user }: WishlistPageProps) {
  // Your component logic here, using initialItems, categories, user
const [wishlist, setWishlist] = useState<WishlistItem[]>(initialItems);
  const [loadingIds, setLoadingIds] = useState<string[]>([]);
  const router = useRouter();

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
      // API call to add item to cart
      const res = await fetch("/api/useritem/move-to-cart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId: item.id }),
      });
      if (!res.ok) throw new Error("Failed to move to cart");
    } catch {
      alert("Failed to move item to cart");
    } finally {
      setLoadingIds((prev) => prev.filter((id) => id !== item.id));
    }
  };

  if (!session?.user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-xl mb-4">You need to log in to view your wishlist.</p>
        <Link href="/auth/signin" className="px-4 py-2 bg-[#5a4436] text-white rounded-lg hover:bg-[#3e2f25] transition">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <>
<Layout categories={categories} user={user}>
      <div className="max-w-4xl mx-auto p-2 min-h-screen">
        <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-[#3e2f25] text-center sm:text-left">
          Your Wishlist
        </h1>

        {wishlist.length === 0 ? (
          <p className="text-center text-gray-700">
            Your wishlist is empty.{" "}
            <Link href="/products" className="text-[#5a4436] hover:underline font-semibold">
              Browse products
            </Link>.
          </p>
        ) : (
          <div className="space-y-2">
            {wishlist.map((item) => (
              <div
                key={item.id}
                className="relative flex flex-row items-center bg-white rounded-xl shadow-sm p-2 gap-2 hover:shadow-md transition-all w-full"
              >
                {/* Remove button */}
                <button
                  onClick={() => handleRemoveItem(item.id)}
                  disabled={loadingIds.includes(item.id)}
                  className="absolute top-1 right-1 text-gray-400 hover:text-red-500 transition-colors p-1 z-10"
                  title="Remove item"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 sm:h-5 sm:w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                {/* Product Image clickable */}
                <div
                  onClick={() => router.push(`/products/${item.product.id}`)}
                  className="cursor-pointer flex-shrink-0 transform transition-transform duration-150 active:scale-105 active:shadow-lg"
                >
                  <img
                    src={item.product.images[0]}
                    alt={item.product.title}
                    className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg"
                  />
                </div>

                {/* Info */}
                <div className="flex-1 flex flex-col justify-between min-w-0 ml-2">
                  <h2 className="font-semibold text-sm sm:text-base text-[#3e2f25] truncate">
                    {item.product.title}
                  </h2>
                  <div className="flex flex-wrap gap-1 text-xs text-gray-600 mt-0.5">
                    {item.color && <span>Color: {item.color}</span>}
                    {item.size && <span>Size: {item.size}</span>}
                  </div>
                </div>

                {/* Price & Move to Cart */}
                <div className="flex flex-col items-end ml-2 gap-1">
                  <div className="text-sm sm:text-base font-semibold text-[#3e2f25]">
                    ${item.product.price.toFixed(2)}
                  </div>
                  <button
                    onClick={() => handleMoveToCart(item)}
                    disabled={loadingIds.includes(item.id)}
                    className="px-2 py-1 bg-[#5a4436] text-white rounded-lg text-xs sm:text-sm hover:bg-[#3e2f25] transition-all duration-150 active:scale-95"
                  >
                    Move to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
</Layout>
    </>
  );
}

// Server-side fetch
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session?.user?.id) {
    return { redirect: { destination: "/auth/signin", permanent: false } };
  }

  // Fetch wishlist items
  const wishlistItems = await prisma.userItem.findMany({
    where: { userId: session.user.id, status: "wishlist" },
    include: { product: true },
  });

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
        id: session.user.id,
        name: session.user.name || "Guest",
      },
    },
  };
}
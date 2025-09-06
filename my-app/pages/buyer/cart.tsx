// pages/buyer/cart.tsx:
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
    <Layout categories={categories} user={user}>
<div className="max-w-4xl mx-auto p-4 min-h-screen bg-[#fdf8f3]">
  <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-[#3e2f25] text-center sm:text-left">
    Your Cart
  </h1>

  {cart.length === 0 ? (
    <p className="text-center text-gray-700">
      Your cart is empty.{" "}
      <Link
        href="/buyer/products"
        className="text-[#5a4436] hover:underline font-semibold"
      >
        Continue shopping
      </Link>.
    </p>
  ) : (
    <div className="space-y-3">
      {cart.map((item) => (
        <div
          key={item.id}
          className="relative flex flex-row items-center bg-[#fffdfb] rounded-2xl shadow-sm p-3 gap-3 hover:shadow-md transition-all w-full"
        >
          <button
            onClick={() => handleRemoveItem(item.id)}
            disabled={loadingIds.includes(item.id)}
            className="absolute top-2 right-2 text-gray-400 hover:text-red-500 transition-colors p-1 z-10"
            title="Remove item"
          >
            ✕
          </button>

          <div
            onClick={() => router.push(`/buyer/products/${item.product.id}`)}
            className="cursor-pointer flex-shrink-0 transform transition-transform duration-150 active:scale-105 active:shadow-lg"
          >
            <img
              src={item.product.images[0]}
              alt={item.product.title}
              className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg"
            />
          </div>

          <div className="flex-1 flex flex-col justify-between min-w-0 ml-2">
            <h2 className="font-semibold text-sm sm:text-base text-[#3e2f25] truncate">
              {item.product.title}
            </h2>

            <div className="flex flex-wrap gap-1 text-xs sm:text-sm text-gray-600 mt-0.5">
              {item.color && <span>Color: {item.color}</span>}
              {item.size && <span>Size: {item.size}</span>}
            </div>

            <div className="flex items-center gap-2 mt-2">
              <button
                disabled={loadingIds.includes(item.id) || item.quantity <= 1}
                onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                className="px-3 py-1 bg-[#d4b996] text-[#3e2f25] rounded hover:bg-[#c4a57e] transition duration-150 active:scale-95"
              >
                -
              </button>
              <span className="px-3 font-medium text-center min-w-[24px] text-sm sm:text-base">
                {item.quantity}
              </span>
              <button
                disabled={loadingIds.includes(item.id) || item.quantity >= item.product.quantity}
                onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                className={`px-3 py-1 rounded transition duration-150 active:scale-95 text-sm sm:text-base ${
                  item.quantity >= item.product.quantity
                    ? "bg-gray-300 cursor-not-allowed text-gray-400"
                    : "bg-[#d4b996] text-[#3e2f25] hover:bg-[#c4a57e]"
                }`}
              >
                +
              </button>
            </div>
          </div>

          <div className="flex-shrink-0 text-sm sm:text-base font-semibold text-[#3e2f25] ml-2">
            ${item.product.price.toFixed(2)}
          </div>
        </div>
      ))}

      <div className="flex flex-col sm:flex-row justify-between items-center mt-4 border-t pt-3 bg-[#fffdfb] p-3 rounded-2xl shadow-sm">
        <span className="text-lg sm:text-xl font-semibold text-[#3e2f25]">
          Total: ${total.toFixed(2)}
        </span>
        <button
          onClick={() => router.push("/buyer/checkout")}
          disabled={cart.length === 0}
          className={`mt-2 sm:mt-0 px-6 py-2 rounded-2xl font-semibold text-sm sm:text-base
            transition-all duration-200 active:scale-95
            ${cart.length === 0
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-[#5a4436] text-[#fdf8f3] hover:bg-[#3e2f25]"}
          `}
        >
          Checkout
        </button>
      </div>
    </div>
  )}
</div>
    </Layout>
  );
}

// ✅ Server-side fetch
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session?.user?.id) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  const cartItems = await prisma.userItem.findMany({
    where: { userId: session.user.id, status: "cart" },
    include: { product: true },
  });

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
        id: session.user.id,
        name: session.user.name || "Guest",
        role: session.user.role,
      },
    },
  };
}

import { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";
import { prisma } from "../lib/prisma";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/router";
import { useCart } from "../context/CartContext";
import Layout from "../components/header";

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
}

interface CartPageProps {
  cartItems: CartItem[];
  session: {
    user?: {
      id: string;
      name?: string;
      email?: string;
    };
  } | null;
}

export default function CartPage({ cartItems: initialCartItems, session, categories, user }: CartPageProps) {
  const [cart, setCart] = useState<CartItem[]>(initialCartItems);
  const [loadingIds, setLoadingIds] = useState<string[]>([]);
  const router = useRouter();
  const { refreshCart, setUserId } = useCart();

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  // Initialize CartContext
  useEffect(() => {
    if (session?.user?.id) {
      setUserId(session.user.id);
      refreshCart();
    }
  }, [session?.user?.id, setUserId, refreshCart]);

  // Fetch latest cart from server
  const fetchLatestCart = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch("/api/useritem/cart-refresh");
      if (!res.ok) return;
      const latestCart: CartItem[] = await res.json();

      setCart(latestCart); // directly replace cart with latest
    } catch (err) {
      console.error("Failed to fetch latest cart", err);
    }
  }, [session?.user?.id]);

  // Cross-tab listener: updates cart immediately when another tab changes cart
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "cartUpdate") {
        fetchLatestCart();
        refreshCart();
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("storage", handleStorage);
    };
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

      localStorage.setItem("cartUpdate", Date.now().toString()); // notify other tabs
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

      localStorage.setItem("cartUpdate", Date.now().toString()); // notify other tabs
      refreshCart();
    } catch {
      alert("Failed to remove item");
    } finally {
      setLoadingIds((prev) => prev.filter((id) => id !== itemId));
    }
  };

  const handleCheckout = () => {
    alert(`Proceeding to checkout. Total: $${total.toFixed(2)}`);
  };

  if (!session?.user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-xl mb-4">You need to log in to view your cart.</p>
        <Link
          href="/auth/signin"
          className="px-4 py-2 bg-[#5a4436] text-white rounded-lg hover:bg-[#3e2f25] transition"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
<Layout categories={categories} user={user}>
    <div className="max-w-4xl mx-auto p-2 min-h-screen">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 text-[#3e2f25] text-center sm:text-left">
        Your Cart
      </h1>

      {cart.length === 0 ? (
        <p className="text-center text-gray-700">
          Your cart is empty.{" "}
          <Link href="/products" className="text-[#5a4436] hover:underline font-semibold">
            Continue shopping
          </Link>.
        </p>
      ) : (
        <div className="space-y-2">
          {cart.map((item) => (
            <div
              key={item.id}
              className="relative flex flex-row items-center bg-white rounded-xl shadow-sm p-2 gap-2 hover:shadow-md transition-all w-full"
            >
              <button
                onClick={() => handleRemoveItem(item.id)}
                disabled={loadingIds.includes(item.id)}
                className="absolute top-1 right-1 text-gray-400 hover:text-red-500 transition-colors p-1 z-10"
                title="Remove item"
              >
                ✕
              </button>

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

              <div className="flex-1 flex flex-col justify-between min-w-0 ml-2">
                <h2 className="font-semibold text-sm sm:text-base text-[#3e2f25] truncate">
                  {item.product.title}
                </h2>
                <div className="flex flex-wrap gap-1 text-xs text-gray-600 mt-0.5">
                  {item.color && <span>Color: {item.color}</span>}
                  {item.size && <span>Size: {item.size}</span>}
                </div>

                <div className="flex items-center gap-1 mt-1 sm:mt-2">
                  <button
                    disabled={loadingIds.includes(item.id) || item.quantity <= 1}
                    onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                    className="px-2 py-0.5 bg-gray-200 hover:bg-gray-300 rounded transition duration-150 active:scale-95 text-sm"
                  >
                    -
                  </button>
                  <span className="px-2 font-medium text-center min-w-[20px] text-sm">{item.quantity}</span>
                  <button
                    disabled={loadingIds.includes(item.id) || item.quantity >= item.product.quantity}
                    onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                    className={`px-2 py-0.5 rounded transition duration-150 active:scale-95 text-sm ${
                      item.quantity >= item.product.quantity
                        ? "bg-gray-300 cursor-not-allowed text-gray-400"
                        : "bg-gray-200 hover:bg-gray-300"
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

          <div className="flex flex-col sm:flex-row justify-between items-center mt-4 border-t pt-2 bg-white p-2 rounded-xl shadow-sm">
            <span className="text-lg sm:text-xl font-semibold text-[#3e2f25]">
              Total: ${total.toFixed(2)}
            </span>
            <button
              onClick={handleCheckout}
              className="mt-2 sm:mt-0 px-5 py-2 bg-[#5a4436] text-white rounded-xl font-semibold hover:bg-[#3e2f25] transition-all duration-200 active:scale-95 text-sm sm:text-base"
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

// Server-side fetch
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session?.user?.id) {
    return { props: { cartItems: [], session: null, categories: [], user: null } };
  }

  // Fetch cart items
  const cartItems = await prisma.userItem.findMany({
    where: { userId: session.user.id, status: "cart" },
    include: { product: true },
  });

  // Fetch categories
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
      session,
      categories,
      user: {
        id: session.user.id,
        name: session.user.name || "Guest",
      },
    },
  };
}
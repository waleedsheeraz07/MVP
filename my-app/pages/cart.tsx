// pages/cart.tsx
import { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";
import { prisma } from "../lib/prisma";
import AdminHeader from "../components/header";
import Link from "next/link";
import { useState, useEffect } from "react";

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
  quantity: number;
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

export default function CartPage({ cartItems: initialCartItems, session }: CartPageProps) {
  const [cart, setCart] = useState<CartItem[]>(initialCartItems);
  const [loadingIds, setLoadingIds] = useState<string[]>([]);

  const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const handleQuantityChange = async (itemId: string, newQty: number) => {
    const item = cart.find((i) => i.id === itemId);
    if (!item || newQty < 1 || newQty > item.product.quantity) return;

    // Optimistic UI update
    setCart((prev) => prev.map((i) => (i.id === itemId ? { ...i, quantity: newQty } : i)));
    setLoadingIds((prev) => [...prev, itemId]);

    try {
      const res = await fetch("/api/useritem/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, quantity: newQty }),
      });
      if (!res.ok) throw new Error("Failed to update quantity");
    } catch {
      alert("Failed to update quantity");
    } finally {
      setLoadingIds((prev) => prev.filter((id) => id !== itemId));
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setLoadingIds((prev) => [...prev, itemId]);
    setCart((prev) => prev.filter((i) => i.id !== itemId));

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

  const handleCheckout = () => {
    alert(`Proceeding to checkout. Total: $${total.toFixed(2)}`);
  };

  // Live stock refresh & auto-adjust quantity
  useEffect(() => {
    if (!session?.user?.id) return;

    const refreshCart = async () => {
      try {
        const res = await fetch("/api/useritem/cart-refresh");
        if (!res.ok) return;

        const latestCart: CartItem[] = await res.json();

        for (const item of cart) {
          const updated = latestCart.find((i) => i.id === item.id);
          if (!updated) continue;

          // If quantity > stock, reduce it and update backend
          if (item.quantity > updated.product.quantity) {
            await handleQuantityChange(item.id, updated.product.quantity);
          }

          // Update stock visually
          setCart((prev) =>
            prev.map((i) =>
              i.id === item.id ? { ...i, product: { ...i.product, quantity: updated.product.quantity } } : i
            )
          );
        }
      } catch {
        // fail silently
      }
    };

    refreshCart(); // run immediately
    const interval = setInterval(refreshCart, 5000); // run every 5s

    return () => clearInterval(interval);
  }, [session?.user?.id, cart]);

  if (!session?.user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <p className="text-xl mb-4">You need to log in to view your cart.</p>
        <Link href="/auth/signin" className="px-4 py-2 bg-[#5a4436] text-white rounded-lg hover:bg-[#3e2f25] transition">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <>
      <AdminHeader title="Cart" titleHref="/cart" />
<div className="max-w-5xl mx-auto p-4 sm:p-6 min-h-screen">
  <h1 className="text-3xl sm:text-4xl font-bold mb-6 text-center sm:text-left text-[#3e2f25]">
    Your Cart
  </h1>

  {cart.length === 0 ? (
    <p className="text-center text-gray-700 text-lg">
      Your cart is empty.{" "}
      <Link href="/products" className="text-[#5a4436] hover:underline font-semibold">
        Continue shopping
      </Link>.
    </p>
  ) : (
    <div className="space-y-4 sm:space-y-6">
      {cart.map((item) => (
        <div
          key={item.id}
          className="flex flex-col sm:flex-row items-center sm:items-start border rounded-2xl p-4 sm:p-6 gap-4 bg-white shadow-md hover:shadow-lg transition-all duration-200"
        >
          <img
            src={item.product.images[0]}
            alt={item.product.title}
            className="w-28 h-28 sm:w-36 sm:h-36 object-cover rounded-xl flex-shrink-0"
          />

          <div className="flex-1 w-full flex flex-col justify-between">
            <div>
              <h2 className="font-semibold text-lg sm:text-xl text-[#3e2f25]">
                {item.product.title}
              </h2>
              {item.color && <p className="text-sm text-gray-600 mt-1">Color: {item.color}</p>}
              {item.size && <p className="text-sm text-gray-600 mt-1">Size: {item.size}</p>}
              <p className="text-sm text-gray-700 mt-1 font-medium">
                Price: ${item.product.price.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500 mt-1">Stock: {item.product.quantity}</p>
            </div>

            <div className="mt-3 flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
              {/* Quantity controls */}
              <div className="flex items-center gap-2 border rounded-lg overflow-hidden">
                <button
                  disabled={loadingIds.includes(item.id) || item.quantity <= 1}
                  onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 transition duration-150"
                >
                  -
                </button>
                <span className="px-3 font-medium">{item.quantity}</span>
                <button
                  disabled={loadingIds.includes(item.id) || item.quantity >= item.product.quantity}
                  onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                  className={`px-3 py-1 transition duration-150 ${
                    item.quantity >= item.product.quantity
                      ? "bg-gray-200 cursor-not-allowed text-gray-400"
                      : "bg-gray-100 hover:bg-gray-200"
                  }`}
                >
                  +
                </button>
              </div>

              {/* Remove button */}
              <button
                disabled={loadingIds.includes(item.id)}
                onClick={() => handleRemoveItem(item.id)}
                className="text-red-500 text-sm hover:underline mt-2 sm:mt-0"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      ))}

      {/* Total & Checkout */}
      <div className="flex flex-col sm:flex-row justify-between items-center mt-6 border-t pt-4 bg-white p-4 rounded-xl shadow-md">
        <span className="text-xl sm:text-2xl font-semibold text-[#3e2f25]">
          Total: ${total.toFixed(2)}
        </span>
        <button
          onClick={handleCheckout}
          className="mt-3 sm:mt-0 px-6 py-3 bg-[#5a4436] text-white rounded-xl font-semibold hover:bg-[#3e2f25] transition-all duration-200"
        >
          Checkout
        </button>
      </div>
    </div>
  )}
</div>
    </>
  );
}

// Server-side fetch
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);
  if (!session?.user?.id) {
    return { props: { cartItems: [], session } };
  }

  const cartItems = await prisma.userItem.findMany({
    where: { userId: session.user.id, status: "cart" },
    include: { product: true },
  });

  // On load, enforce quantity <= stock
  for (const item of cartItems) {
    if (item.quantity > item.product.quantity) {
      await prisma.userItem.update({
        where: { id: item.id },
        data: { quantity: item.product.quantity },
      });
      item.quantity = item.product.quantity;
    }
  }

  return {
    props: {
      cartItems: cartItems.map((i) => ({
        ...i,
        product: { ...i.product, quantity: i.product.quantity ?? 0 },
      })),
      session,
    },
  };
}
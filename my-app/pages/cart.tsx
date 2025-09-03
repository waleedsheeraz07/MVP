import { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";
import { prisma } from "../lib/prisma";
import AdminHeader from "../components/header";
import Link from "next/link";
import { useState, useMemo } from "react";

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
  const [cartItems, setCartItems] = useState<CartItem[]>(initialCartItems);
  const [loadingIds, setLoadingIds] = useState<string[]>([]);

  // Hooks must be called unconditionally
  const total = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cartItems]
  );

  if (!session?.user) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <p className="text-xl mb-4">You need to log in to view your cart.</p>
        <Link href="/auth/signin" className="px-4 py-2 bg-[#5a4436] text-white rounded-lg">
          Sign In
        </Link>
      </div>
    );
  }

  const handleQuantityChange = async (itemId: string, newQty: number) => {
    const item = cartItems.find((i) => i.id === itemId);
    if (!item) return;

    if (newQty < 1 || newQty > item.product.quantity) return;

    setLoadingIds((prev) => [...prev, itemId]);
    try {
      const res = await fetch("/api/useritem/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, quantity: newQty }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to update quantity");
      }

      const updatedItem = await res.json();
      setCartItems((prev) =>
        prev.map((i) =>
          i.id === itemId ? { ...i, quantity: updatedItem.quantity } : i
        )
      );
    } catch {
      alert("Failed to update quantity");
    } finally {
      setLoadingIds((prev) => prev.filter((id) => id !== itemId));
    }
  };

  const handleRemoveItem = async (itemId: string) => {
    setLoadingIds((prev) => [...prev, itemId]);
    try {
      const res = await fetch("/api/useritem/remove", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId }),
      });
      if (!res.ok) throw new Error("Failed to remove item");
      setCartItems((prev) => prev.filter((i) => i.id !== itemId));
    } catch {
      alert("Failed to remove item");
    } finally {
      setLoadingIds((prev) => prev.filter((id) => id !== itemId));
    }
  };

  const handleCheckout = () => {
    alert(`Proceeding to checkout. Total: $${total.toFixed(2)}`);
  };

  return (
    <>
      <AdminHeader title="Cart" titleHref="/cart" />
      <div className="max-w-5xl mx-auto p-6 min-h-screen">
        <h1 className="text-3xl font-bold mb-6">Your Cart</h1>
        {cartItems.length === 0 ? (
          <p>
            Your cart is empty. <Link href="/products" className="text-[#5a4436]">Continue shopping</Link>.
          </p>
        ) : (
          <div className="space-y-6">
            {cartItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between border p-4 rounded-lg gap-4">
                <img src={item.product.images[0]} alt={item.product.title} className="w-24 h-24 object-cover rounded-lg" />
                <div className="flex-1">
                  <h2 className="font-semibold">{item.product.title}</h2>
                  {item.color && <p>Color: {item.color}</p>}
                  {item.size && <p>Size: {item.size}</p>}
                  <p>Price: ${item.product.price.toFixed(2)}</p>
                  <p>Stock: {item.product.quantity}</p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <div className="flex gap-1 items-center">
                    <button
                      disabled={loadingIds.includes(item.id) || item.quantity <= 1}
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      className="px-2 py-1 bg-gray-200 rounded"
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button
                      disabled={loadingIds.includes(item.id) || item.quantity >= item.product.quantity}
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      className={`px-2 py-1 rounded ${item.quantity >= item.product.quantity ? "bg-gray-300 cursor-not-allowed" : "bg-gray-200"}`}
                    >
                      +
                    </button>
                  </div>
                  <button
                    disabled={loadingIds.includes(item.id)}
                    onClick={() => handleRemoveItem(item.id)}
                    className="text-red-500 text-sm mt-1"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center mt-4">
              <span className="text-xl font-semibold">Total: ${total.toFixed(2)}</span>
              <button
                onClick={handleCheckout}
                className="px-6 py-3 bg-[#5a4436] text-white rounded-lg hover:bg-[#3e2f25] transition"
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

  return {
    props: {
      cartItems: cartItems.map((i) => ({
        ...i,
        product: {
          ...i.product,
          quantity: i.product.quantity ?? 99,
        },
      })),
      session,
    },
  };
}
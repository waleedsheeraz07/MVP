"use client";

import { createContext, useContext, ReactNode, useState, useCallback, useEffect } from "react";

// Type for guest cart items in localStorage
type GuestCartItem = {
  productId: string;
  color: string | null;
  size: string | null;
  quantity: number;
  price: number;
  image: string | null;
};

interface CartContextType {
  cartCount: number;
  setCartCount: (count: number) => void;
  refreshCart: () => Promise<void>;
  setUserId: (id: string | null) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartCount, setCartCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  // Refresh cart count (DB for logged-in users, localStorage for guests)
  const refreshCart = useCallback(async () => {
    if (userId) {
      // Logged-in user: fetch from backend
      try {
        const res = await fetch(`/api/cart/count?userId=${userId}`);
        const data = await res.json();
        setCartCount(data.count || 0);
      } catch (err) {
        console.error("Failed to fetch cart count:", err);
      }
    } else {
      // Guest: read from localStorage
      const localCart: GuestCartItem[] = JSON.parse(localStorage.getItem("guestCart") || "[]");
      const totalQty = localCart.reduce((sum, item) => sum + item.quantity, 0);
      setCartCount(totalQty);
    }
  }, [userId]);

  // Listen for cart updates from other tabs (localStorage)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "cartUpdate") {
        refreshCart();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [refreshCart]);

  // Initial cart count on mount
  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  return (
    <CartContext.Provider value={{ cartCount, setCartCount, refreshCart, setUserId }}>
      {children}
    </CartContext.Provider>
  );
};

// Hook to access CartContext
export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
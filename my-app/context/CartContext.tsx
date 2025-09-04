"use client";

import { createContext, useContext, ReactNode, useState, useCallback, useEffect } from "react";

interface CartContextType {
  cartCount: number;
  setCartCount: (count: number) => void;
  refreshCart: () => Promise<void>;
  setUserId: (id: string) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartCount, setCartCount] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);

  const refreshCart = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/cart/count?userId=${userId}`);
      const data = await res.json();
      setCartCount(data.count || 0);
    } catch (err) {
      console.error("Failed to fetch cart count:", err);
    }
  }, [userId]);

  // Listen to cart changes from other tabs
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === "cartUpdate") {
        refreshCart();
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [refreshCart]);

  return (
    <CartContext.Provider value={{ cartCount, setCartCount, refreshCart, setUserId }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
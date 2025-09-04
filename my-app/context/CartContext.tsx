"use client";

import { createContext, useContext, ReactNode, useState, useCallback } from "react";

interface CartContextType {
  cartCount: number;
  setCartCount: (count: number) => void;
  refreshCart: () => Promise<void>; // no parameters
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
"use client";

import { createContext, useContext, ReactNode, useState, useCallback } from "react";

interface CartContextType {
  cartCount: number;
  setCartCount: (count: number) => void;
  refreshCart: (userId?: string) => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartCount, setCartCount] = useState(0);

  const refreshCart = useCallback(async (userId?: string) => {
    if (!userId) return;
    try {
      const res = await fetch(`/api/cart/count?userId=${userId}`);
      const data = await res.json();
      setCartCount(data.count || 0);
    } catch (err) {
      console.error("Failed to fetch cart count:", err);
    }
  }, []);

  return (
    <CartContext.Provider value={{ cartCount, setCartCount, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};
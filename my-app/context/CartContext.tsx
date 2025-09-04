"use client";

import { createContext, useContext, useState, ReactNode, useEffect } from "react";

interface CartContextType {
  cartCount: number;
  setCartCount: (count: number) => void;
  refreshCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartCount, setCartCount] = useState(0);

  // Fetch cart count from API
  const refreshCart = async () => {
    try {
      const res = await fetch("/api/cart/count");
      const data = await res.json();
      setCartCount(data.count || 0);
    } catch (err) {
      console.error("Failed to fetch cart count:", err);
    }
  };

  useEffect(() => {
    refreshCart();
  }, []);

  return (
    <CartContext.Provider value={{ cartCount, setCartCount, refreshCart }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
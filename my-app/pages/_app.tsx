// pages/_app.tsx
"use client";
import Head from "next/head";
import type { AppProps } from "next/app";
import "@/styles/globals.css";

import { CartProvider, useCart } from "../context/CartContext";
import RouteLoader from "../components/RouteLoader";
import { Toaster } from "react-hot-toast";
import { useEffect } from "react";

function AppWrapper({ Component, pageProps }: AppProps) {
  const { setCartCount } = useCart(); // get setter from CartContext

  // Sync guest cart across tabs
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "cartUpdate") {
        const localCart = JSON.parse(localStorage.getItem("guestCart") || "[]") as {
          quantity: number;
        }[];
        const totalQty = localCart.reduce((sum, item) => sum + item.quantity, 0);
        setCartCount(totalQty);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [setCartCount]);

  return (
    <>
      <Head>
        <link rel="icon" type="image/png" href="/favicon.PNG" />
        <link rel="apple-touch-icon" href="/favicon.PNG" />
      </Head>

      <RouteLoader />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: "#8B5E3C",
            color: "#fff",
            fontWeight: "500",
            borderRadius: "8px",
            padding: "12px 18px",
          },
          success: { iconTheme: { primary: "#FFD700", secondary: "#FFF" } },
          error: { iconTheme: { primary: "#FF4C4C", secondary: "#FFF" } },
        }}
      />

      <Component {...pageProps} />
    </>
  );
}

export default function App(props: AppProps) {
  return (
    <CartProvider>
      <AppWrapper {...props} />
    </CartProvider>
  );
}
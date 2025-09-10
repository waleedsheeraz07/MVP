// pages/_app.tsx
"use client"; // Enable client-side hooks
import Head from "next/head";
import type { AppProps } from "next/app";
import "@/styles/globals.css";

import { CartProvider } from "../context/CartContext";
import RouteLoader from "../components/RouteLoader";
import { Toaster } from "react-hot-toast";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      {/* Head section for favicon and meta */}
      <Head>
        <link rel="icon" type="image/png" href="/favicon.PNG" />
        <link rel="apple-touch-icon" href="/favicon.PNG" />
      </Head>

      {/* Global providers */}
      <CartProvider>
        {/* Route loading indicator */}
        <RouteLoader />

        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: "#8B5E3C", // golden brown
              color: "#fff",
              fontWeight: "500",
              borderRadius: "8px",
              padding: "12px 18px",
            },
            success: {
              iconTheme: {
                primary: "#FFD700", // gold icon
                secondary: "#FFF",
              },
            },
            error: {
              iconTheme: {
                primary: "#FF4C4C",
                secondary: "#FFF",
              },
            },
          }}
        />

        {/* Main page component */}
        <Component {...pageProps} />
      </CartProvider>
    </>
  );
}
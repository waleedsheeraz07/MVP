// pages/_app.tsx
"use client"; // Ensures we can use client hooks like useState/useEffect
import type { AppProps } from 'next/app'
import Head from 'next/head'
import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { CartProvider } from "../context/CartContext";

export default function App({ Component, pageProps }: AppProps) {
  return (
<>
<Head>
        <link rel="icon" type="image/png" href="/favicon.PNG" />
<link rel="apple-touch-icon" href="/favicon.PNG" />
  
     </Head>
    <CartProvider>
      <Component {...pageProps} />
    </CartProvider>

</>
  );
}
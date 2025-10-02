// components/RouteLoader.tsx
"use client";

import { useRouter } from "next/router";
import { useState, useEffect } from "react";

export default function RouteLoader() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleStart = () => setLoading(true);
    const handleComplete = () => setLoading(false);

    router.events.on("routeChangeStart", handleStart);
    router.events.on("routeChangeComplete", handleComplete);
    router.events.on("routeChangeError", handleComplete);

    return () => {
      router.events.off("routeChangeStart", handleStart);
      router.events.off("routeChangeComplete", handleComplete);
      router.events.off("routeChangeError", handleComplete);
    };
  }, [router]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 bg-[rgba(62,47,37,0.6)] backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center space-y-4 transform scale-105">
        {/* Animated Spinner */}
        <div className="relative">
          <div className="w-16 h-16 border-4 border-[#f8efe4] rounded-full"></div>
          <div className="w-16 h-16 border-4 border-[#8b4513] border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          
          {/* Vintage Center Dot */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-[#8b4513] rounded-full"></div>
        </div>

        {/* Loading Text */}
        <div className="text-center">
          <p className="text-[#3e2f25] font-semibold text-lg mb-1">Loading</p>
          <p className="text-[#5a4436] text-sm">Discovering vintage treasures...</p>
        </div>

        {/* Animated Dots */}
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-[#8b4513] rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-[#8b4513] rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-[#8b4513] rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

interface Category {
  id: string;
  title: string;
  order: number;
  parentId?: string | null;
}

interface LayoutProps {
  children: React.ReactNode;
  categories: Category[];
  user?: { name?: string | null };
}

// Type for exposing the updateCart function globally if needed
export interface LayoutCartControl {
  updateCartCount: () => void;
}

export default function Layout({ children, categories, user }: LayoutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const [cartCount, setCartCount] = useState(0);

  // Function to fetch cart items from MongoDB and calculate total
  const fetchCartCount = async () => {
    try {
      const res = await fetch("/api/cart/items"); // your API that returns cart items
      const data = await res.json();
      const total = data.items.reduce((sum: number, item: any) => sum + item.quantity, 0);
      setCartCount(total);
    } catch (err) {
      console.error("Failed to fetch cart items:", err);
      setCartCount(0);
    }
  };

  // Call on mount
  useEffect(() => {
    fetchCartCount();
  }, []);

  // Function to call whenever cart changes
  const updateCartCount = () => fetchCartCount();

  // Build hierarchical categories
  const topCategories = categories.filter(c => !c.parentId);
  const subCategoriesMap = categories.reduce<Record<string, Category[]>>((acc, c) => {
    if (c.parentId) {
      if (!acc[c.parentId]) acc[c.parentId] = [];
      acc[c.parentId].push(c);
    }
    return acc;
  }, {});

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsOpen(true)} className="text-gray-700 hover:text-black focus:outline-none">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="font-medium text-gray-800">{user?.name ? `Hello, ${user.name}` : "Hello, Guest"}</span>
        </div>

        {/* Cart Icon with count */}
        <div className="relative">
          <Link href="/cart" className="text-gray-700 hover:text-black">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13l-1.6 8H19M7 13l-4-8" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </header>

      {/* Sidebar Overlay */}
      {isOpen && <div className="fixed inset-0 bg-black bg-opacity-40 z-40" onClick={() => setIsOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 w-72 h-full bg-white shadow-lg transform transition-transform duration-300 z-50 flex flex-col ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="p-4 flex justify-between items-center border-b">
          <div>
            <p className="font-bold text-lg">{user?.name || "Guest"}</p>
            <p className="text-sm text-gray-500">Welcome back</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-gray-600 hover:text-black text-xl font-bold">✕</button>
        </div>

        <nav className="p-4 space-y-6 overflow-y-auto flex-1">
          {/* Categories & Navigation */}
          {/* ... same as before */}
        </nav>

        {/* Sticky Sign Out */}
        {user && (
          <div className="p-4 border-t">
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="w-full text-left text-red-600 font-medium hover:text-red-800">
              Sign Out
            </button>
          </div>
        )}
      </aside>

      <main className="flex-1">{children}</main>
    </div>
  );
}
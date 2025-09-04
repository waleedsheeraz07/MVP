"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useCart } from "../context/CartContext";

interface Category {
  id: string;
  title: string;
  order: number;
  parentId?: string | null;
}

interface LayoutProps {
  children: React.ReactNode;
  categories: Category[];
  user?: { id: string; name?: string | null };
}

export default function Layout({ children, categories, user }: LayoutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const { cartCount, refreshCart, setUserId } = useCart();

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

  // Initialize cart count for logged-in user
  useEffect(() => {
    if (user?.id) {
      setUserId(user.id);
      refreshCart();
    }
  }, [user?.id, setUserId, refreshCart]);

  return (
<div className="min-h-screen flex flex-col bg-[#fdf8f3] text-[#3e2f25]">
  {/* Header */}
<header className="bg-[#fffdfb] border-b shadow-sm flex items-center justify-between sticky top-0 z-10 relative px-4">
  {/* Hamburger */}
  <button
    onClick={() => setIsOpen(true)}
    className="text-[#3e2f25] hover:text-[#5a4436] transition-colors focus:outline-none my-4"
  >
    <svg
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      strokeWidth={2}
      stroke="currentColor"
      className="w-7 h-7"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
  </button>

  {/* Centered Logo */}
  <div className="absolute left-1/2 transform -translate-x-1/2">
    <Link href="/">
      <img
        src="/logo.png"
        alt="Website Logo"
        className="w-12 h-12 sm:w-12 sm:h-12 object-contain"
      />
    </Link>
  </div>

  {/* Cart Icon */}
  <Link
    href="/cart"
    className="relative inline-block text-[#3e2f25] hover:text-[#5a4436] transition-colors text-2xl sm:text-3xl my-4"
  >
    <span
      role="img"
      aria-label="cart"
      className="transition-transform duration-200 hover:scale-110"
    >
      🛒
    </span>

    {/* Animated Cart Count Badge */}
    {cartCount > 0 && (
      <span className="absolute -top-2 -right-2 bg-gradient-to-tr from-[#b58b5a] to-[#d4b996] text-[#fffdfb] rounded-full px-2 text-xs sm:text-sm font-bold shadow-lg animate-bounce">
        {cartCount}
      </span>
    )}
  </Link>
</header>

  {/* Sidebar Overlay */}
  {isOpen && (
    <div
      className="fixed inset-0 bg-[rgba(62,47,37,0.4)] backdrop-blur-sm z-40 transition-opacity duration-300"
   onClick={() => setIsOpen(false)}
    />
  )}

  {/* Sidebar */}
  <aside
    className={`fixed top-0 left-0 w-72 h-full bg-[#fffdfb] shadow-lg transform transition-transform duration-300 z-50 ${
      isOpen ? "translate-x-0" : "-translate-x-full"
    } flex flex-col`}
  >
    {/* Sidebar Header */}
    <div className="p-4 flex justify-between items-center border-b bg-[#f9f4ec]">
      <div>
        <p className="font-bold text-lg text-[#3e2f25]">{user?.name || "Guest"}</p>
        <p className="text-sm text-gray-600">Welcome back</p>
      </div>
      <button
        onClick={() => setIsOpen(false)}
        className="text-[#5a4436] hover:text-[#3e2f25] text-xl font-bold"
      >
        ✕
      </button>
    </div>

    {/* Sidebar Nav */}
    <nav className="p-4 space-y-6 overflow-y-auto flex-1">
      {/* My Account */}
      <div>
        <h3 className="text-[#3e2f25] font-semibold mb-2">👤 My Account</h3>
        <ul className="space-y-1 pl-3 text-gray-600">
          <li>
            <Link href="/profile" className="hover:text-[#5a4436] transition-colors">
              My Profile
            </Link>
          </li>
        </ul>
      </div>

      {/* Seller */}
      <div>
        <h3 className="text-[#3e2f25] font-semibold mb-2">📦 Seller</h3>
        <ul className="space-y-1 pl-3 text-gray-600">
          <li>
            <Link href="/seller/products" className="hover:text-[#5a4436] transition-colors">
              My Products
            </Link>
          </li>
          <li>
            <Link href="/seller/order" className="hover:text-[#5a4436] transition-colors">
              My Orders
            </Link>
          </li>
        </ul>
      </div>

      {/* Buyer */}
      <div>
        <h3 className="text-[#3e2f25] font-semibold mb-2">🛒 Buyer</h3>
        <ul className="space-y-1 pl-3 text-gray-600">
          <li>
            <Link href="/order" className="hover:text-[#5a4436] transition-colors">
              My Orders
            </Link>
          </li>
          <li>
            <Link
              href="/cart"
              className="hover:text-[#5a4436] transition-colors flex items-center gap-1"
            >
              My Cart
              {cartCount > 0 && (
                <span className="ml-1 bg-[#b58b5a] text-[#fffdfb] rounded-full px-2 text-xs">
                  {cartCount}
                </span>
              )}
            </Link>
          </li>
          <li>
            <Link href="/wishlist" className="hover:text-[#5a4436] transition-colors">
              My Wishlist
            </Link>
          </li>
        </ul>
      </div>

      {/* Products */}
      <div>
        <h3 className="text-[#3e2f25] font-semibold mb-2">🛍️ Products</h3>
        <ul className="space-y-1 pl-3 text-gray-600">
          <li>
            <Link href="/products" className="hover:text-[#5a4436] transition-colors">
              All Products
            </Link>
          </li>

          {topCategories.map((top) => (
            <li key={top.id} className="space-y-1">
              <button
                onClick={() => toggleCategory(top.id)}
                className="flex justify-between w-full font-medium text-[#3e2f25] hover:text-[#5a4436] transition-colors focus:outline-none"
              >
                <span>{top.title}</span>
                <span>{expandedCategories[top.id] ? "▾" : "▸"}</span>
              </button>
              {expandedCategories[top.id] && subCategoriesMap[top.id] && (
                <ul className="pl-4 space-y-1 text-gray-600">
                  {subCategoriesMap[top.id].map((sub) => (
                    <li key={sub.id}>
                      <Link
                        href={`/products/category/${sub.id}`}
                        className="hover:text-[#5a4436] transition-colors"
                      >
                        {sub.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      </div>
    </nav>

    {/* Sign Out Button */}
    {user && (
      <div className="p-4 border-t bg-[#f9f4ec]">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full bg-[#3e2f25] text-[#fdf8f3] px-4 py-2 rounded-lg font-semibold hover:bg-[#5a4436] transition"
        >
          Sign Out
        </button>
      </div>
    )}
  </aside>

  {/* Main Content */}
  <main className="flex-1">{children}</main>
</div>
  );
}
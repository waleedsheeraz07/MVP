"use client";

import { useState } from "react";
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

export default function Layout({ children, categories, user }: LayoutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

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
        <button
          onClick={() => setIsOpen(true)}
          className="text-gray-700 hover:text-black focus:outline-none"
        >
          {/* Hamburger Icon */}
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
        <span className="font-medium text-gray-800">
          {user?.name ? `Hello, ${user.name}` : "Hello, Guest"}
        </span>
      </header>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 w-72 h-full bg-white shadow-lg transform transition-transform duration-300 z-50 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 flex justify-between items-center border-b">
          <div>
            <p className="font-bold text-lg">{user?.name || "Guest"}</p>
            <p className="text-sm text-gray-500">Welcome back</p>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-gray-600 hover:text-black text-xl font-bold"
          >
            ✕
          </button>
        </div>

        <nav className="p-4 space-y-6 overflow-y-auto h-[calc(100%-4rem)]">
          {/* My Account */}
          <div>
            <h3 className="text-gray-700 font-semibold mb-2">👤 My Account</h3>
            <ul className="space-y-1 pl-3 text-gray-600">
              <li>
                <Link href="/profile" className="hover:text-black">
                  My Profile
                </Link>
              </li>
              {user && (
                <li>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="hover:text-black w-full text-left"
                  >
                    Sign Out
                  </button>
                </li>
              )}
            </ul>
          </div>

          {/* Seller */}
          <div>
            <h3 className="text-gray-700 font-semibold mb-2">📦 Seller</h3>
            <ul className="space-y-1 pl-3 text-gray-600">
              <li>
                <Link href="/seller/products" className="hover:text-black">
                  My Products
                </Link>
              </li>
              <li>
                <Link href="/seller/orders" className="hover:text-black">
                  My Orders
                </Link>
              </li>
            </ul>
          </div>

          {/* Buyer */}
          <div>
            <h3 className="text-gray-700 font-semibold mb-2">🛒 Buyer</h3>
            <ul className="space-y-1 pl-3 text-gray-600">
              <li>
                <Link href="/orders" className="hover:text-black">
                  My Orders
                </Link>
              </li>
              <li>
                <Link href="/cart" className="hover:text-black">
                  My Cart
                </Link>
              </li>
              <li>
                <Link href="/wishlist" className="hover:text-black">
                  My Wishlist
                </Link>
              </li>
            </ul>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-gray-700 font-semibold mb-2">🛍️ Products</h3>
            <ul className="space-y-1 pl-3 text-gray-600">
              <li>
                <Link href="/products" className="hover:text-black">
                  All Products
                </Link>
              </li>

              {topCategories.map(top => (
                <li key={top.id} className="space-y-1">
                  <button
                    onClick={() => toggleCategory(top.id)}
                    className="flex justify-between w-full font-medium text-gray-700 hover:text-black focus:outline-none"
                  >
                    <span>{top.title}</span>
                    <span>{expandedCategories[top.id] ? "▾" : "▸"}</span>
                  </button>
                  {expandedCategories[top.id] && subCategoriesMap[top.id] && (
                    <ul className="pl-4 space-y-1 text-gray-500">
                      {subCategoriesMap[top.id].map(sub => (
                        <li key={sub.id}>
                          <Link
                            href={`/products/category/${sub.id}`}
                            className="hover:text-black"
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
      </aside>

      {/* Main Content */}
      <main className="flex-1">{children}</main>
    </div>
  );
}
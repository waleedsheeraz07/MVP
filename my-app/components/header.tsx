// components/header.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
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
  user?: {
    id: string;
    name?: string | null;
    role?: string | null;
  };
}

interface CategoryNode extends Category {
  children?: CategoryNode[];
}

export default function Layout({ children, categories, user }: LayoutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const { cartCount, refreshCart, setUserId } = useCart();

  // Build hierarchical category tree
  const categoryTree: CategoryNode[] = useMemo(() => {
    const map: Record<string, CategoryNode> = {};
    categories.forEach(c => { map[c.id] = { ...c, children: [] }; });
    const roots: CategoryNode[] = [];
    categories.forEach(c => {
      if (c.parentId && map[c.parentId]) map[c.parentId].children!.push(map[c.id]);
      else roots.push(map[c.id]);
    });
    return roots;
  }, [categories]);

  const toggleCategory = (id: string) => {
    setExpandedCategories(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Initialize cart
  useEffect(() => {
    if (user?.id) {
      setUserId(user.id);
      refreshCart();
    }
  }, [user?.id, setUserId, refreshCart]);

  // Recursive render of categories
  const renderCategory = (cat: CategoryNode) => (
    <li key={cat.id} className="space-y-1">
      <div className="flex items-center justify-between">
        <Link
          href={`/buyer/products?categories=${cat.id}`}
          className="font-medium text-[#3e2f25] hover:text-[#5a4436] transition-colors flex-grow"
        >
          {cat.title}
        </Link>
        {cat.children?.length ? (
          <button
            type="button"
            onClick={() => toggleCategory(cat.id)}
            className="ml-2 text-sm font-bold focus:outline-none"
          >
            {expandedCategories[cat.id] ? "▾" : "▸"}
          </button>
        ) : null}
      </div>
      {cat.children?.length && expandedCategories[cat.id] && (
        <ul className="pl-4 space-y-1">
          {cat.children.map(child => renderCategory(child))}
        </ul>
      )}
    </li>
  );

  return (
    <div className="min-h-screen flex flex-col bg-[#fdf8f3] text-[#3e2f25]">
      {/* Header */}
      <header className="bg-[#fffdfb] border-b shadow-sm flex items-center justify-between sticky top-0 z-10 relative px-4">
        <button
          onClick={() => setIsOpen(true)}
          className="text-[#3e2f25] hover:text-[#5a4436] transition-colors focus:outline-none my-4"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="absolute left-1/2 transform -translate-x-1/2">
          <Link href="/buyer/products">
            <img src="/logo.png" alt="Logo" className="w-18 h-18 sm:w-12 sm:h-12 object-contain" />
          </Link>
        </div>

        <Link href="/buyer/cart" className="relative inline-block text-[#3e2f25] hover:text-[#5a4436] transition-colors text-2xl sm:text-3xl my-4">
          <span role="img" aria-label="cart" className="transition-transform duration-200 hover:scale-110">🛒</span>
          {cartCount > 0 && (
            <span className="absolute -top-2 -right-2 bg-gradient-to-tr from-[#b58b5a] to-[#d4b996] text-[#fffdfb] rounded-full px-2 text-xs sm:text-sm font-bold shadow-lg animate-bounce">
              {cartCount}
            </span>
          )}
        </Link>
      </header>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-[rgba(62,47,37,0.4)] backdrop-blur-sm z-40 transition-opacity duration-300" onClick={() => setIsOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 w-72 h-full bg-[#fffdfb] shadow-lg transform transition-transform duration-300 z-50 ${isOpen ? "translate-x-0" : "-translate-x-full"} flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-4 flex justify-between items-center border-b bg-[#f9f4ec]">
          <div>
            <p className="font-bold text-lg text-[#3e2f25]">{user?.name || "Guest"}</p>
            <p className="text-sm text-gray-600">Welcome back</p>
          </div>
          <button onClick={() => setIsOpen(false)} className="text-[#5a4436] hover:text-[#3e2f25] text-xl font-bold">✕</button>
        </div>

        <nav className="p-4 space-y-6 overflow-y-auto flex-1">
          {/* My Account */}
          <div>
            <h3 className="text-[#3e2f25] font-semibold mb-2">👤 My Account</h3>
            <ul className="space-y-1 pl-3 text-gray-600">
              <li><Link href="/profile" className="hover:text-[#5a4436] transition-colors">My Profile</Link></li>
            </ul>
          </div>

          {/* Admin */}
          {user?.role === "ADMIN" && (
            <div>
              <h3 className="text-[#3e2f25] font-semibold mb-2">🛡️ Admin</h3>
              <ul className="space-y-1 pl-3 text-gray-600">
                <li><Link href="/admin/users" className="hover:text-[#5a4436] transition-colors">Manage Users</Link></li>
                <li><Link href="/admin/categories" className="hover:text-[#5a4436] transition-colors">Manage Categories</Link></li>
              </ul>
            </div>
          )}

          {/* Seller */}
          <div>
            <h3 className="text-[#3e2f25] font-semibold mb-2">📦 Seller</h3>
            <ul className="space-y-1 pl-3 text-gray-600">
              <li><Link href="/seller/products" className="hover:text-[#5a4436] transition-colors">My Products</Link></li>
              <li><Link href="/seller/order" className="hover:text-[#5a4436] transition-colors">My Orders</Link></li>
            </ul>
          </div>

          {/* Buyer */}
          <div>
            <h3 className="text-[#3e2f25] font-semibold mb-2">🛒 Buyer</h3>
            <ul className="space-y-1 pl-3 text-gray-600">
              <li><Link href="/buyer/order" className="hover:text-[#5a4436] transition-colors">My Orders</Link></li>
              <li>
                <Link href="/buyer/cart" className="hover:text-[#5a4436] transition-colors flex items-center gap-1">
                  My Cart
                  {cartCount > 0 && <span className="ml-1 bg-[#b58b5a] text-[#fffdfb] rounded-full px-2 text-xs">{cartCount}</span>}
                </Link>
              </li>
              <li><Link href="/buyer/wishlist" className="hover:text-[#5a4436] transition-colors">My Wishlist</Link></li>
            </ul>
          </div>

          {/* Products Categories */}
          <div>
            <h3 className="text-[#3e2f25] font-semibold mb-2">🛍️ Products</h3>
            <ul className="space-y-1 pl-3 text-gray-600">
              <li><Link href="/buyer/products" className="hover:text-[#5a4436] transition-colors">All Products</Link></li>
              {categoryTree.map(cat => renderCategory(cat))}
            </ul>
          </div>
        </nav>

        {/* Sign Out */}
        {user && (
          <div className="p-4 border-t bg-[#f9f4ec]">
            <button onClick={() => signOut({ callbackUrl: "/login" })} className="w-full bg-[#3e2f25] text-[#fdf8f3] px-4 py-2 rounded-lg font-semibold hover:bg-[#5a4436] transition">
              Sign Out
            </button>
          </div>
        )}
      </aside>

      <main className="flex-1">{children}</main>
    </div>
  );
}
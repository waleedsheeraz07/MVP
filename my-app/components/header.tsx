// components/header.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";
import { useCart } from "../context/CartContext";
import { useRouter } from "next/router";

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
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});
  const { cartCount, refreshCart, setUserId } = useCart();

  const closeSidebar = () => setIsOpen(false);

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

  // Helper: collect all descendant IDs including the category itself
  const collectCategoryIds = (category: CategoryNode): string[] => {
    const ids: string[] = [category.id];
    if (category.children) {
      for (const child of category.children) {
        ids.push(...collectCategoryIds(child));
      }
    }
    return ids;
  };

  // Recursive render of categories
  const renderCategory = (cat: CategoryNode) => {
    const categoryIds = collectCategoryIds(cat).join("%2C"); // use encoded commas

    return (
      <li key={cat.id} className="space-y-1">
        <div className="flex items-center justify-between">
          <Link
            href={`/buyer/products?categories=${categoryIds}`}
            className="font-medium text-[#3e2f25] hover:text-[#8b4513] transition-colors duration-300 flex-grow py-1"
            onClick={closeSidebar}
          >
            {cat.title}
          </Link>
          {cat.children?.length ? (
            <button
              type="button"
              onClick={() => toggleCategory(cat.id)}
              className="ml-2 w-6 h-6 flex items-center justify-center text-[#8b4513] hover:bg-[#f8efe4] rounded-lg transition-colors duration-200 cursor-pointer"
            >
              {expandedCategories[cat.id] ? "▾" : "▸"}
            </button>
          ) : null}
        </div>
        {cat.children?.length && expandedCategories[cat.id] && (
          <ul className="ml-4 pl-3 border-l-2 border-[#e6d9c6] space-y-1 mt-1">
            {cat.children.map(child => renderCategory(child))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#fefaf5] text-[#3e2f25]">
      {/* Header */}
      <header className="bg-white border-b border-[#e6d9c6] shadow-sm flex items-center justify-between sticky top-0 z-10 relative px-4 sm:px-6 py-3">
        {/* Menu Button */}
        <button
          onClick={() => setIsOpen(true)}
          className="text-[#3e2f25] hover:text-[#8b4513] hover:bg-[#f8efe4] p-2 rounded-xl transition-all duration-300 focus:outline-none cursor-pointer"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {/* Logo */}
        <div className="absolute left-1/2 transform -translate-x-1/2">
          <Link href="/buyer/products" onClick={closeSidebar} className="block transform hover:scale-105 transition-transform duration-300">
            <div className="bg-[#8b4513] rounded-2xl p-2 shadow-lg">
              <img 
                src="/logo.png" 
                alt="Vintage Marketplace" 
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain" 
              />
            </div>
          </Link>
        </div>

        {/* Cart Icon */}
        <Link href="/buyer/cart" className="relative inline-block text-[#3e2f25] hover:text-[#8b4513] hover:bg-[#f8efe4] p-2 rounded-xl transition-all duration-300 group">
          <div className="relative">
            <svg className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5.5M7 13l2.5 5.5m0 0L17 13m-7.5 5.5L9.5 21" />
            </svg>
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-gradient-to-tr from-[#8b4513] to-[#b58b5a] text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-bold shadow-lg animate-bounce">
                {cartCount}
              </span>
            )}
          </div>
        </Link>
      </header>

      {/* Sidebar Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-[rgba(62,47,37,0.6)] backdrop-blur-sm z-40 transition-opacity duration-300"
          onClick={closeSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 w-80 h-full bg-white shadow-xl transform transition-transform duration-300 z-50 ${isOpen ? "translate-x-0" : "-translate-x-full"} flex flex-col`}>
        {/* Sidebar Header */}
        <div className="p-6 flex justify-between items-center border-b border-[#e6d9c6] bg-[#fdf8f3]">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#8b4513] to-[#b58b5a] rounded-full flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-lg">
                {user?.name ? user.name.charAt(0).toUpperCase() : "G"}
              </span>
            </div>
            <div>
              <p className="font-bold text-lg text-[#3e2f25]">{user?.name || "Guest"}</p>
              <p className="text-sm text-[#5a4436]">Welcome back!</p>
            </div>
          </div>
          <button 
            onClick={closeSidebar} 
            className="text-[#5a4436] hover:text-[#8b4513] hover:bg-[#f8efe4] w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <nav className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* My Account */}
          <div>
            <h3 className="text-[#3e2f25] font-bold text-lg mb-3 flex items-center space-x-2">
              <div className="w-6 h-6 bg-[#8b4513] rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <span>My Account</span>
            </h3>
            <ul className="space-y-2 ml-2">
              <li>
                <Link 
                  href="/profile" 
                  className="block py-2 px-4 text-[#5a4436] hover:text-[#8b4513] hover:bg-[#f8efe4] rounded-xl transition-all duration-300" 
                  onClick={closeSidebar}
                >
                  My Profile
                </Link>
              </li>
            </ul>
          </div>

          {/* Admin */}
          {user?.role === "ADMIN" && (
            <div>
              <h3 className="text-[#3e2f25] font-bold text-lg mb-3 flex items-center space-x-2">
                <div className="w-6 h-6 bg-[#8b4513] rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <span>Admin</span>
              </h3>
              <ul className="space-y-2 ml-2">
                <li>
                  <Link 
                    href="/admin/users" 
                    className="block py-2 px-4 text-[#5a4436] hover:text-[#8b4513] hover:bg-[#f8efe4] rounded-xl transition-all duration-300" 
                    onClick={closeSidebar}
                  >
                    Manage Users
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/admin/categories" 
                    className="block py-2 px-4 text-[#5a4436] hover:text-[#8b4513] hover:bg-[#f8efe4] rounded-xl transition-all duration-300" 
                    onClick={closeSidebar}
                  >
                    Manage Categories
                  </Link>
                </li>
              </ul>
            </div>
          )}

          {/* Seller */}
          <div>
            <h3 className="text-[#3e2f25] font-bold text-lg mb-3 flex items-center space-x-2">
              <div className="w-6 h-6 bg-[#8b4513] rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <span>Seller</span>
            </h3>
            <ul className="space-y-2 ml-2">
              <li>
                <Link 
                  href="/seller/products" 
                  className="block py-2 px-4 text-[#5a4436] hover:text-[#8b4513] hover:bg-[#f8efe4] rounded-xl transition-all duration-300" 
                  onClick={closeSidebar}
                >
                  My Products
                </Link>
              </li>
              <li>
                <Link 
                  href="/seller/order" 
                  className="block py-2 px-4 text-[#5a4436] hover:text-[#8b4513] hover:bg-[#f8efe4] rounded-xl transition-all duration-300" 
                  onClick={closeSidebar}
                >
                  My Orders
                </Link>
              </li>
            </ul>
          </div>

          {/* Buyer */}
          <div>
            <h3 className="text-[#3e2f25] font-bold text-lg mb-3 flex items-center space-x-2">
              <div className="w-6 h-6 bg-[#8b4513] rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5.5M7 13l2.5 5.5m0 0L17 13m-7.5 5.5L9.5 21" />
                </svg>
              </div>
              <span>Buyer</span>
            </h3>
            <ul className="space-y-2 ml-2">
              <li>
                <Link 
                  href="/buyer/order" 
                  className="block py-2 px-4 text-[#5a4436] hover:text-[#8b4513] hover:bg-[#f8efe4] rounded-xl transition-all duration-300" 
                  onClick={closeSidebar}
                >
                  My Orders
                </Link>
              </li>
              <li>
                <Link 
                  href="/buyer/cart" 
                  className="block py-2 px-4 text-[#5a4436] hover:text-[#8b4513] hover:bg-[#f8efe4] rounded-xl transition-all duration-300 flex items-center justify-between" 
                  onClick={closeSidebar}
                >
                  <span>My Cart</span>
                  {cartCount > 0 && (
                    <span className="bg-[#8b4513] text-white rounded-full px-2 py-1 text-xs font-bold min-w-6 flex items-center justify-center">
                      {cartCount}
                    </span>
                  )}
                </Link>
              </li>
              <li>
                <Link 
                  href="/buyer/wishlist" 
                  className="block py-2 px-4 text-[#5a4436] hover:text-[#8b4513] hover:bg-[#f8efe4] rounded-xl transition-all duration-300" 
                  onClick={closeSidebar}
                >
                  My Wishlist
                </Link>
              </li>
            </ul>
          </div>

          {/* Products Categories */}
          <div>
            <h3 className="text-[#3e2f25] font-bold text-lg mb-3 flex items-center space-x-2">
              <div className="w-6 h-6 bg-[#8b4513] rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                </svg>
              </div>
              <span>Products</span>
            </h3>
            <ul className="space-y-2 ml-2">
              <li>
                <Link 
                  href="/buyer/products" 
                  className="block py-2 px-4 text-[#5a4436] hover:text-[#8b4513] hover:bg-[#f8efe4] rounded-xl transition-all duration-300 font-semibold" 
                  onClick={closeSidebar}
                >
                  All Products
                </Link>
              </li>
              <div className="mt-2 space-y-1">
                {categoryTree.map(cat => renderCategory(cat))}
              </div>
            </ul>
          </div>
        </nav>

        {/* Sign Out / Login */}
        <div className="p-6 border-t border-[#e6d9c6] bg-[#fdf8f3]">
          {user && user.role && user.role.toLowerCase() !== "guest" ? (
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full bg-[#8b4513] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#6b3410] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>Sign Out</span>
            </button>
          ) : (
            <button
              onClick={() => router.push("/login")}
              className="w-full bg-[#8b4513] text-white px-6 py-3 rounded-xl font-bold hover:bg-[#6b3410] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              <span>Login</span>
            </button>
          )}
        </div>
      </aside>

      <main className="flex-1">{children}</main>
    </div>
  );
}
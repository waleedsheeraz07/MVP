// pages/buyer/products/[id].tsx
import Head from 'next/head'
import { prisma } from "../../../lib/prisma";
import Link from "next/link";
import { useState, useRef, useEffect } from "react";
import { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../../api/auth/[...nextauth]";
import Layout from "../../../components/header";
import { useCart } from "../../../context/CartContext";
import SwipeableGallery from "../../../components/SwipeableGallery";
import { useSwipeable } from "react-swipeable";
import { showToast } from "../../../utils/toast";

interface Category { id: string; title: string; order: number; parentId?: string | null; }
interface User { id: string; name?: string | null; role: string; }

interface Product {
  id: string
  title: string
  description?: string
  price: number
  quantity: number
  images: string[]
}

interface ProductDetailProps {
  product: {
    id: string;
    title: string;
    description?: string;
    price: number;
    images: string[];
    colors: string[];
    sizes: (string | null)[];
    condition: string;
    era: string;
    quantity: number;
  };
  categories: Category[];
  user: User;
  session: { user?: { id: string; name?: string; email?: string } } | null;
  products: Product[];
}

export default function ProductDetail({ product, categories, user, session, products }: ProductDetailProps) {
 const [galleryOpen, setGalleryOpen] = useState(false);
 const validSizes = product.sizes.filter(s => s && s.trim() !== "");
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { refreshCart } = useCart();

  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);


// inside your component
useEffect(() => {
  if (galleryOpen) {
    document.body.style.overflow = "hidden"; // disable scroll
  } else {
    document.body.style.overflow = ""; // restore scroll
  }

  return () => {
    document.body.style.overflow = ""; // cleanup just in case
  };
}, [galleryOpen]);


  useEffect(() => {
    if (validSizes.length === 1 && product.colors.length === 0) setSelectedSize(validSizes[0]);
    else if (product.colors.length === 1 && validSizes.length === 0) setSelectedColor(product.colors[0]);
    else if (validSizes.length === 1 && product.colors.length === 1) {
      setSelectedSize(validSizes[0]);
      setSelectedColor(product.colors[0]);
    }
  }, [validSizes, product.colors]);

  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const handleScroll = () => setActiveIndex(Math.round(container.scrollLeft / container.clientWidth));
    container.addEventListener("scroll", handleScroll);
    return () => container.removeEventListener("scroll", handleScroll);
  }, []);

  const handleDotClick = (index: number) => {
    const container = scrollRef.current;
    if (!container) return;
    container.scrollTo({ left: index * container.clientWidth, behavior: "smooth" });
    setActiveIndex(index);
  };

  const isAddToCartDisabled = () => {
    if (validSizes.length > 1 && !selectedSize) return true;
    if (product.colors.length > 1 && !selectedColor) return true;
    if (product.quantity === 0) return true; // disable if sold out
    return false;
  };

  const handleAddItem = async (status: "cart" | "wishlist") => {
    if (!session?.user?.id) {
      showToast("You need to log in first");
      return;
    }
    if (status === "cart" && isAddToCartDisabled()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/useritem/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: session.user.id,
          productId: product.id,
          color: selectedColor,
          size: selectedSize,
          quantity: 1,
          status,
        }),
      });
      refreshCart();
      localStorage.setItem("cartUpdate", Date.now().toString());

      const data: { error?: string } = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add item");
      showToast(status === "cart" ? "Product added to cart!" : "Product added to wishlist!");
 } catch (err: unknown) {
      if (err instanceof Error) alert(err.message);
      else showToast("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };



const carouselHandlers = useSwipeable({
  onSwipedLeft: () => {
    if (activeIndex < product.images.length - 1) setActiveIndex(activeIndex + 1);
  },
  onSwipedRight: () => {
    if (activeIndex > 0) setActiveIndex(activeIndex - 1);
  },
  preventScrollOnSwipe: true, // ✅ replaces preventDefaultTouchmoveEvent
  trackMouse: true, // optional: allow mouse dragging on desktop
});


}

export async function getServerSideProps(context: GetServerSidePropsContext) {
 

 const products = await prisma.product.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      title: true,
      description: true,
      price: true,
      images: true,
    },
  })

 const session = await getServerSession(context.req, context.res, authOptions);
  const { id } = context.params as { id: string };

  const product = await prisma.product.findUnique({ where: { id } });
  if (!product) return { notFound: true };

  const categories = await prisma.category.findMany({
    select: { id: true, title: true, order: true, parentId: true },
    orderBy: { order: "asc" },
  });

  return {
    props: {
      product: {
        ...product,
        createdAt: product.createdAt.toISOString(),
        updatedAt: product.updatedAt.toISOString(),
      },
      categories,
      user: session?.user
        ? { id: session.user.id, name: session.user.name || "Guest", role: session.user.role }
        : { id: "", name: "Guest" },
      session,
      products,
    },
  };
}
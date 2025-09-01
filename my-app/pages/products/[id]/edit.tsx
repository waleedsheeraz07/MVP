// pages/products/[id]/edit.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { GetServerSidePropsContext } from "next";
import { prisma } from "../../../lib/prisma";
import formidable, { File, Files, Fields } from "formidable";
import fs from "fs";

interface ProductEditProps {
  product: {
    id: string;
    title: string;
    description?: string;
    price: number;
    quantity: number;
    colors: string[];
    sizes: string[];
    images: string[];
  };
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const { id } = context.params!;

  const product = await prisma.product.findUnique({
    where: { id: id as string },
  });

  if (!product) {
    return { notFound: true };
  }

  return { props: { product } };
}

export default function EditProductPage({ product }: ProductEditProps) {
  const router = useRouter();
  const [title, setTitle] = useState(product.title);
  const [description, setDescription] = useState(product.description || "");
  const [price, setPrice] = useState(product.price.toString());
  const [quantity, setQuantity] = useState(product.quantity.toString());
  const [colors, setColors] = useState(product.colors.join(","));
  const [sizes, setSizes] = useState(product.sizes.join(","));
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>(product.images || []);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImageChange = (files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    setImages(fileArray);
    setPreviews(fileArray.map((f) => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("quantity", quantity);
      formData.append("colors", colors);
      formData.append("sizes", sizes);
      images.forEach((file) => formData.append("images", file));

      const res = await fetch(`/api/products/${product.id}/edit`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update product");

      router.push("/products");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Edit Product</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required style={{ display: "block", margin: "1rem 0", padding: "0.5rem", width: "100%" }} />
        <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} style={{ display: "block", margin: "1rem 0", padding: "0.5rem", width: "100%" }} />
        <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} required style={{ display: "block", margin: "1rem 0", padding: "0.5rem", width: "100%" }} />
        <input type="number" placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} required style={{ display: "block", margin: "1rem 0", padding: "0.5rem", width: "100%" }} />

        <h3>Images</h3>
        <input type="file" accept="image/*" multiple onChange={(e) => handleImageChange(e.target.files)} style={{ display: "block", marginBottom: "1rem", width: "100%" }} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {previews.map((url, idx) => <img key={idx} src={url} alt={`Preview ${idx}`} style={{ maxWidth: "200px", maxHeight: "200px", objectFit: "cover", border: "1px solid #ccc" }} />)}
        </div>

        <input type="text" placeholder="Colors (comma separated)" value={colors} onChange={(e) => setColors(e.target.value)} style={{ display: "block", margin: "1rem 0", padding: "0.5rem", width: "100%" }} />
        <input type="text" placeholder="Sizes (comma separated)" value={sizes} onChange={(e) => setSizes(e.target.value)} style={{ display: "block", margin: "1rem 0", padding: "0.5rem", width: "100%" }} />

        <button type="submit" disabled={loading} style={{ padding: "0.5rem 1rem", cursor: "pointer" }}>
          {loading ? "Saving..." : "Update Product"}
        </button>
      </form>
    </div>
  );
}
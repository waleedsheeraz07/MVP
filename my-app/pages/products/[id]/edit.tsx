"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";

interface Product {
  id: string;
  title: string;
  description?: string;
  price: number;
  quantity: number;
  colors: string[];
  sizes: string[];
  images: string[];
}

interface EditProps {
  productId: string;
}

export default function EditProductPage({ productId }: EditProps) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [debug, setDebug] = useState<any>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [colors, setColors] = useState<string>("");
  const [sizes, setSizes] = useState<string>("");

  const [images, setImages] = useState<File[]>([]); // new uploads
  const [previews, setPreviews] = useState<string[]>([]); // new previews

  const [existingImages, setExistingImages] = useState<string[]>([]); // already uploaded

  // Load product data on mount
  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${productId}/edit`);
        if (!res.ok) throw new Error("Failed to fetch product");
        const data: Product = await res.json();
        setTitle(data.title);
        setDescription(data.description || "");
        setPrice(data.price.toString());
        setQuantity(data.quantity.toString());
        setColors(data.colors.join(","));
        setSizes(data.sizes.join(","));
        setExistingImages(data.images || []);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
    }

    fetchProduct();
  }, [productId]);

  // Handle new file uploads and previews
  const handleImageChange = (files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    setImages((prev) => {
      const updated = [...prev, ...fileArray];
      setPreviews(updated.map((f) => URL.createObjectURL(f)));
      return updated;
    });
  };

  // Remove existing image
  const removeExistingImage = (url: string) => {
    setExistingImages(existingImages.filter((img) => img !== url));
  };

  // Remove new image
  const removeNewImage = (url: string) => {
    const index = previews.findIndex((p) => p === url);
    if (index >= 0) {
      setPreviews((prev) => prev.filter((_, i) => i !== index));
      setImages((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setDebug(null);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("quantity", quantity);
      formData.append("colors", colors);
      formData.append("sizes", sizes);

      // keep existing images
      existingImages.forEach((img) => formData.append("existingImages", img));

      // add new images
      images.forEach((file) => formData.append("images", file));

      const res = await fetch(`/api/products/${productId}/edit`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update product");

      router.push("/products"); // redirect to products page
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      setDebug((err as { debug?: any })?.debug || null);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      const res = await fetch(`/api/products/${productId}/delete`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete product");
      router.push("/products");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    }
  };

  if (loading) return <p>Loading product...</p>;

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Edit Product</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {debug && <pre style={{ background: "#f0f0f0", padding: "1rem" }}>{JSON.stringify(debug, null, 2)}</pre>}

      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Title" value={title} onChange={e => setTitle(e.target.value)} required style={{ display: "block", margin: "1rem 0", padding: "0.5rem", width: "100%" }} />
        <textarea placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} style={{ display: "block", margin: "1rem 0", padding: "0.5rem", width: "100%" }} />
        <input type="number" placeholder="Price" value={price} onChange={e => setPrice(e.target.value)} required style={{ display: "block", margin: "1rem 0", padding: "0.5rem", width: "100%" }} />
        <input type="number" placeholder="Quantity" value={quantity} onChange={e => setQuantity(e.target.value)} required style={{ display: "block", margin: "1rem 0", padding: "0.5rem", width: "100%" }} />

        <h3>Existing Images</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1rem" }}>
          {existingImages.map((url) => (
            <div key={url} style={{ position: "relative" }}>
              <img src={url} alt="Existing" style={{ maxWidth: "150px", maxHeight: "150px", objectFit: "cover" }} />
              <button type="button" onClick={() => removeExistingImage(url)} style={{ position: "absolute", top: 0, right: 0, background: "red", color: "white", border: "none" }}>X</button>
            </div>
          ))}
        </div>

        <h3>Upload New Images</h3>
        <input type="file" accept="image/*" multiple onChange={e => handleImageChange(e.target.files)} style={{ display: "block", marginBottom: "1rem", width: "100%" }} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {previews.map((url) => (
            <div key={url} style={{ position: "relative" }}>
              <img src={url} alt="Preview" style={{ maxWidth: "150px", maxHeight: "150px", objectFit: "cover" }} />
              <button type="button" onClick={() => removeNewImage(url)} style={{ position: "absolute", top: 0, right: 0, background: "red", color: "white", border: "none" }}>X</button>
            </div>
          ))}
        </div>

        <input type="text" placeholder="Colors (comma separated)" value={colors} onChange={e => setColors(e.target.value)} style={{ display: "block", margin: "1rem 0", padding: "0.5rem", width: "100%" }} />
        <input type="text" placeholder="Sizes (comma separated)" value={sizes} onChange={e => setSizes(e.target.value)} style={{ display: "block", margin: "1rem 0", padding: "0.5rem", width: "100%" }} />

        <button type="submit" disabled={saving} style={{ padding: "0.5rem 1rem", cursor: "pointer", marginRight: "1rem" }}>
          {saving ? "Saving..." : "Save Changes"}
        </button>

        <button type="button" onClick={handleDelete} style={{ padding: "0.5rem 1rem", cursor: "pointer", background: "red", color: "white" }}>
          Delete Product
        </button>
      </form>
    </div>
  );
}
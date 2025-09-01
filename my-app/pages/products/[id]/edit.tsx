"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
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

export default function EditProductPage() {
  const router = useRouter();
  const { id: productId } = router.query;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [debug, setDebug] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [colors, setColors] = useState("");
  const [sizes, setSizes] = useState("");

  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>([]);

  // Load product
  useEffect(() => {
    if (!productId) return;

    async function fetchProduct() {
      setLoading(true);
      try {
        console.log("Fetching product", productId);
        const res = await fetch(`/api/products/${productId}/edit`);
        const data = await res.json();

        console.log("Fetch response:", res.status, data);

        if (!res.ok) throw new Error(data.error || "Failed to fetch product");

        setTitle(data.title);
        setDescription(data.description || "");
        setPrice(data.price.toString());
        setQuantity(data.quantity.toString());
        setColors(data.colors.join(","));
        setSizes(data.sizes.join(","));
        setExistingImages(data.images || []);
      } catch (err: unknown) {
        console.error("Fetch error:", err);
        setError(err instanceof Error ? err.message : "Something went wrong");
        setDebug(JSON.stringify(err, null, 2));
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [productId]);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setImages((prev) => {
      const updated = [...prev, ...files];
      setPreviews(updated.map((f) => URL.createObjectURL(f)));
      return updated;
    });
  };

  const removeExistingImage = (url: string) =>
    setExistingImages((prev) => prev.filter((img) => img !== url));

  const removeNewImage = (url: string) => {
    const index = previews.findIndex((p) => p === url);
    if (index >= 0) {
      setPreviews((prev) => prev.filter((_, i) => i !== index));
      setImages((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setDebug(null);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("quantity", quantity);
      formData.append("colors", colors);
      formData.append("sizes", sizes);

      existingImages.forEach((img) => formData.append("existingImages", img));
      images.forEach((file) => formData.append("images", file));

      console.log("Submitting form data:", { title, description, price, quantity, colors, sizes, existingImages });

      const res = await fetch(`/api/products/${productId}/edit`, {
        method: "POST",
        body: formData,
      });
      const data = await res.json();

      console.log("Submit response:", res.status, data);

      if (!res.ok) throw new Error(data.error || "Failed to update product");

      router.push("/products");
    } catch (err: unknown) {
      console.error("Submit error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setDebug(JSON.stringify(err, null, 2));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this product?")) return;
    try {
      console.log("Deleting product", productId);
      const res = await fetch(`/api/products/${productId}/delete`, { method: "DELETE" });
      const data = await res.json();
      console.log("Delete response:", res.status, data);
      if (!res.ok) throw new Error(data.error || "Failed to delete product");
      router.push("/products");
    } catch (err: unknown) {
      console.error("Delete error:", err);
      setError(err instanceof Error ? err.message : "Something went wrong");
      setDebug(JSON.stringify(err, null, 2));
    }
  };

  if (loading) return <p>Loading product...</p>;

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Edit Product</h1>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {debug && (
        <pre style={{ background: "#f0f0f0", padding: "1rem", maxHeight: "300px", overflow: "auto" }}>
          {debug}
        </pre>
      )}

      {/* form */}
      <form onSubmit={handleSubmit}>
        <input type="text" placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required />
        <textarea placeholder="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        <input type="number" placeholder="Price" value={price} onChange={(e) => setPrice(e.target.value)} required />
        <input type="number" placeholder="Quantity" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />

        <h3>Existing Images</h3>
        {existingImages.map((url) => (
          <div key={url}>
            <img src={url} alt="Existing" style={{ width: "100px" }} />
            <button type="button" onClick={() => removeExistingImage(url)}>X</button>
          </div>
        ))}

        <h3>Upload New Images</h3>
        <input type="file" accept="image/*" multiple onChange={handleImageChange} />
        {previews.map((url) => (
          <div key={url}>
            <img src={url} alt="Preview" style={{ width: "100px" }} />
            <button type="button" onClick={() => removeNewImage(url)}>X</button>
          </div>
        ))}

        <input type="text" placeholder="Colors" value={colors} onChange={(e) => setColors(e.target.value)} />
        <input type="text" placeholder="Sizes" value={sizes} onChange={(e) => setSizes(e.target.value)} />

        <button type="submit" disabled={saving}>{saving ? "Saving..." : "Save Changes"}</button>
        <button type="button" onClick={handleDelete} style={{ background: "red", color: "white" }}>
          Delete Product
        </button>
      </form>
    </div>
  );
}
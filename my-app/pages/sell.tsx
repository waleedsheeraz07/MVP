"use client";

import { useState } from "react";
import { useRouter } from "next/router";

export default function SellProductPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Add files and generate previews
  const handleImageChange = (files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    setImages((prev) => {
      const updated = [...prev, ...fileArray];
      const urls = updated.map((f) => URL.createObjectURL(f));
      setPreviews(urls);
      return updated;
    });
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

      colors.forEach((c) => formData.append("colors[]", c));
      sizes.forEach((s) => formData.append("sizes[]", s));
      images.forEach((file) => formData.append("images", file));

      const res = await fetch("/api/products/create", {
        method: "POST",
        body: formData, // send as FormData
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Sell a Product</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          style={{ display: "block", margin: "1rem 0", padding: "0.5rem", width: "100%" }}
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          style={{ display: "block", margin: "1rem 0", padding: "0.5rem", width: "100%" }}
        />

        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
          style={{ display: "block", margin: "1rem 0", padding: "0.5rem", width: "100%" }}
        />

        <input
          type="number"
          placeholder="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
          style={{ display: "block", margin: "1rem 0", padding: "0.5rem", width: "100%" }}
        />

        <h3>Images</h3>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleImageChange(e.target.files)}
          style={{ display: "block", marginBottom: "1rem", width: "100%" }}
        />

        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {previews.map((url, idx) => (
            <img
              key={idx}
              src={url}
              alt={`Preview ${idx}`}
              style={{ maxWidth: "200px", maxHeight: "200px", objectFit: "cover", border: "1px solid #ccc" }}
            />
          ))}
        </div>

        <input
          type="text"
          placeholder="Colors (comma separated)"
          value={colors.join(",")}
          onChange={(e) => setColors(e.target.value.split(",").map((c) => c.trim()))}
          style={{ display: "block", margin: "1rem 0", padding: "0.5rem", width: "100%" }}
        />

        <input
          type="text"
          placeholder="Sizes (comma separated)"
          value={sizes.join(",")}
          onChange={(e) => setSizes(e.target.value.split(",").map((s) => s.trim()))}
          style={{ display: "block", margin: "1rem 0", padding: "0.5rem", width: "100%" }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{ padding: "0.5rem 1rem", cursor: "pointer" }}
        >
          {loading ? "Saving..." : "Create Product"}
        </button>
      </form>
    </div>
  );
}
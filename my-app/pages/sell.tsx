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
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImageChange = (index: number, file: File) => {
    const newImages = [...images];
    newImages[index] = file;
    setImages(newImages);
  };

  const handleAddImage = () => setImages([...images, new File([], "")]);

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
      images.forEach((img) => formData.append("images", img));

      const res = await fetch("/api/products/create", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      setError(message);
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
        {images.map((img, idx) => (
          <input
            key={idx}
            type="file"
            accept="image/*"
            onChange={(e) => e.target.files?.[0] && handleImageChange(idx, e.target.files[0])}
            style={{ display: "block", margin: "0.5rem 0", width: "100%" }}
          />
        ))}
        <button type="button" onClick={handleAddImage} style={{ marginBottom: "1rem" }}>
          Add Image
        </button>

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
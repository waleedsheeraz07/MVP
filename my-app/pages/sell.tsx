"use client";

import { useState } from "react";
import { useRouter } from "next/router";

export default function SellProductPage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [images, setImages] = useState<string[]>([]); // Base64 strings
  const [previews, setPreviews] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [sizes, setSizes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Convert File to Base64
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
    });

  const handleAddImage = () => setImages([...images, ""]);

  const handleImageChange = async (index: number, file: File) => {
    try {
      const base64 = await fileToBase64(file);
      const newImages = [...images];
      newImages[index] = base64;
      setImages(newImages);

      const newPreviews = [...previews];
      newPreviews[index] = base64;
      setPreviews(newPreviews);
    } catch (err) {
      console.error("Error reading file:", err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const body = {
        title,
        description,
        price,
        quantity,
        colors,
        sizes,
        images: images.filter(Boolean),
      };

      const res = await fetch("/api/products/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Something went wrong");
      }

      router.push("/dashboard");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
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
        {images.map((img, idx) => (
          <div key={idx} style={{ marginBottom: "1rem" }}>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => e.target.files?.[0] && handleImageChange(idx, e.target.files[0])}
              style={{ display: "block", marginBottom: "0.5rem", width: "100%" }}
            />
            {previews[idx] && (
              <img
                src={previews[idx]}
                alt={`Preview ${idx}`}
                style={{ maxWidth: "200px", maxHeight: "200px", objectFit: "cover", border: "1px solid #ccc" }}
              />
            )}
          </div>
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

        <button type="submit" disabled={loading} style={{ padding: "0.5rem 1rem", cursor: "pointer" }}>
          {loading ? "Saving..." : "Create Product"}
        </button>
      </form>
    </div>
  );
}
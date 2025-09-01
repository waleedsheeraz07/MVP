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
  const [colors, setColors] = useState<string>("");
  const [sizes, setSizes] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImageChange = (files: FileList | null) => {
    if (!files) return;
    const fileArray = Array.from(files);
    setImages(prev => {
      const updated = [...prev, ...fileArray];
      setPreviews(updated.map(f => URL.createObjectURL(f)));
      return updated;
    });
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => prev.filter((_, i) => i !== index));
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
      images.forEach(file => formData.append("images", file));

      const res = await fetch("/api/products/create", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw data;

      router.push("/myproducts");
    } catch (err: any) {
      setError(err?.error || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      maxWidth: "800px",
      margin: "2rem auto",
      padding: "1rem",
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem", textAlign: "center" }}>Sell a Product</h1>

      {error && <p style={{ color: "red", textAlign: "center" }}>{error}</p>}

      <form onSubmit={handleSubmit} style={{
        display: "flex",
        flexDirection: "column",
        gap: "1rem"
      }}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
          style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #ccc", width: "100%" }}
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={e => setDescription(e.target.value)}
          style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #ccc", width: "100%", minHeight: "100px" }}
        />

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <input
            type="number"
            placeholder="Price"
            value={price}
            onChange={e => setPrice(e.target.value)}
            required
            style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #ccc", flex: "1 1 45%" }}
          />
          <input
            type="number"
            placeholder="Quantity"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            required
            style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #ccc", flex: "1 1 45%" }}
          />
        </div>

        <div>
          <h3 style={{ marginBottom: "0.5rem" }}>Images</h3>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={e => handleImageChange(e.target.files)}
            style={{ display: "block", marginBottom: "0.5rem", width: "100%" }}
          />
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
            {previews.map((url, idx) => (
              <div key={idx} style={{ position: "relative" }}>
                <img
                  src={url}
                  alt={`Preview ${idx}`}
                  style={{ width: "120px", height: "120px", objectFit: "cover", borderRadius: "8px", border: "1px solid #ccc" }}
                />
                <button
                  type="button"
                  onClick={() => removeImage(idx)}
                  style={{
                    position: "absolute",
                    top: "-8px",
                    right: "-8px",
                    background: "red",
                    color: "#fff",
                    border: "none",
                    borderRadius: "50%",
                    width: "24px",
                    height: "24px",
                    cursor: "pointer",
                    fontWeight: "bold",
                  }}
                >×</button>
              </div>
            ))}
          </div>
        </div>

        <input
          type="text"
          placeholder="Colors (comma separated, e.g. Red,Blue)"
          value={colors}
          onChange={e => setColors(e.target.value)}
          style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #ccc", width: "100%" }}
        />

        <input
          type="text"
          placeholder="Sizes (comma separated, e.g. S,M,L)"
          value={sizes}
          onChange={e => setSizes(e.target.value)}
          style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #ccc", width: "100%" }}
        />

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "0.75rem",
            borderRadius: "8px",
            border: "none",
            background: "#4CAF50",
            color: "#fff",
            fontSize: "1rem",
            cursor: "pointer",
            transition: "0.2s",
          }}
        >
          {loading ? "Saving..." : "Create Product"}
        </button>
      </form>
    </div>
  );
}
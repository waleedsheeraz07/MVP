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

  // add file
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages([...images, ...Array.from(e.target.files)]);
    }
  };

  const uploadImagesToCloudinary = async (): Promise<string[]> => {
    const uploadedUrls: string[] = [];
    for (const file of images) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_PRESET!);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: "POST", body: formData }
      );

      const data = await res.json();
      if (data.secure_url) uploadedUrls.push(data.secure_url);
    }
    return uploadedUrls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Step 1: upload images to Cloudinary
      const uploadedUrls = await uploadImagesToCloudinary();

      // Step 2: send product data with Cloudinary URLs
      const res = await fetch("/api/products/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          price,
          quantity,
          colors,
          sizes,
          images: uploadedUrls,
        }),
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
        />

        <textarea
          placeholder="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />

        <input
          type="number"
          placeholder="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />

        <input
          type="number"
          placeholder="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />

        <h3>Upload Images</h3>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={handleImageChange}
        />

        <input
          type="text"
          placeholder="Colors (comma separated)"
          value={colors.join(",")}
          onChange={(e) =>
            setColors(e.target.value.split(",").map((c) => c.trim()))
          }
        />

        <input
          type="text"
          placeholder="Sizes (comma separated)"
          value={sizes.join(",")}
          onChange={(e) =>
            setSizes(e.target.value.split(",").map((s) => s.trim()))
          }
        />

        <button type="submit" disabled={loading}>
          {loading ? "Saving..." : "Create Product"}
        </button>
      </form>
    </div>
  );
}
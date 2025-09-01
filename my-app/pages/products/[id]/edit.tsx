import { useState, ChangeEvent, FormEvent } from "react";
import { useRouter } from "next/router";
import clientPromise from "../../../lib/mongodb"; // adjust if path differs
import { ObjectId } from "mongodb";

export default function EditProductPage({ product }: { product: any }) {
  const router = useRouter();
  const { id } = router.query;

  const [title, setTitle] = useState(product.title || "");
  const [description, setDescription] = useState(product.description || "");
  const [price, setPrice] = useState(product.price?.toString() || "");
  const [quantity, setQuantity] = useState(product.quantity?.toString() || "");
  const [colors, setColors] = useState(product.colors?.join(",") || "");
  const [sizes, setSizes] = useState(product.sizes?.join(",") || "");

  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [existingImages, setExistingImages] = useState<string[]>(
    product.images || []
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    setImages((prev) => [...prev, ...files]);
    setPreviews((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const removeExistingImage = (url: string) => {
    setExistingImages((prev) => prev.filter((img) => img !== url));
  };

  const removeNewImage = (url: string) => {
    const index = previews.findIndex((p) => p === url);
    if (index >= 0) {
      setPreviews((prev) => prev.filter((_, i) => i !== index));
      setImages((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSaving(true);
    setError(null);

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

      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Update failed");

      router.push(`/products/${id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "auto", padding: "2rem" }}>
      <h1>Edit Product</h1>
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

        <input
          type="text"
          placeholder="Colors (comma separated)"
          value={colors}
          onChange={(e) => setColors(e.target.value)}
        />

        <input
          type="text"
          placeholder="Sizes (comma separated)"
          value={sizes}
          onChange={(e) => setSizes(e.target.value)}
        />

        <input type="file" multiple onChange={handleImageChange} />

        <div>
          <h3>Existing Images</h3>
          {existingImages.map((img) => (
            <div key={img}>
              <img src={img} width="100" />
              <button type="button" onClick={() => removeExistingImage(img)}>
                Remove
              </button>
            </div>
          ))}
        </div>

        <div>
          <h3>New Images</h3>
          {previews.map((src) => (
            <div key={src}>
              <img src={src} width="100" />
              <button type="button" onClick={() => removeNewImage(src)}>
                Remove
              </button>
            </div>
          ))}
        </div>

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}

// Load product from MongoDB
export async function getServerSideProps(context: any) {
  const { id } = context.params;
  const client = await clientPromise;
  const db = client.db("yourdbname"); // replace with your db name
  const product = await db
    .collection("products")
    .findOne({ _id: new ObjectId(id) });

  if (!product) {
    return { notFound: true };
  }

  product._id = product._id.toString();

  return {
    props: { product: JSON.parse(JSON.stringify(product)) },
  };
}
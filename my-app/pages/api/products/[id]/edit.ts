// pages/api/products/[id]/edit.ts
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../../lib/prisma";
import formidable, { File, Files, Fields } from "formidable";
import fs from "fs";
import cloudinary from "../../../../lib/cloudinary";

// Disable Next.js default body parsing
export const config = { api: { bodyParser: false } };

interface FormFields {
  title: string;
  description?: string;
  price: string;
  quantity: string;
  colors?: string[];
  sizes?: string[];
}

// Normalize string or string[] to string[]
const normalizeField = (field?: string | string[]): string[] =>
  !field ? [] : Array.isArray(field) ? field.map(String) : [String(field)];

// Parse form data
const parseForm = (req: NextApiRequest): Promise<{ fields: FormFields; files: File[] }> =>
  new Promise((resolve, reject) => {
    const form = formidable({ multiples: true });
    form.parse(req, (err: any, fields: Fields, files: Files) => {
      if (err) return reject(err);

      const uploadedFiles: File[] = [];
      if (files.images) {
        if (Array.isArray(files.images)) uploadedFiles.push(...(files.images as File[]));
        else uploadedFiles.push(files.images as File);
      }

      const safeFields: FormFields = {
        title: fields.title?.toString() || "",
        description: fields.description?.toString(),
        price: fields.price?.toString() || "0",
        quantity: fields.quantity?.toString() || "0",
        colors: normalizeField(fields.colors),
        sizes: normalizeField(fields.sizes),
      };

      resolve({ fields: safeFields, files: uploadedFiles });
    });
  });

// Upload file to Cloudinary
const uploadFileToCloudinary = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream({ folder: "products" }, (err, result) => {
      if (err) return reject(err);
      resolve(result?.secure_url || "");
    });
    fs.createReadStream(file.filepath).pipe(stream);
  });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  const productId = req.query.id as string;
  if (!productId) return res.status(400).json({ error: "Product ID missing" });

  try {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: "Product not found" });

    // Only owner can edit
    const userId = (session.user as { id?: string }).id;
    if (product.ownerId !== userId) return res.status(403).json({ error: "Forbidden" });

    const { fields, files } = await parseForm(req);
    const { title, description, price, quantity, colors, sizes } = fields;

    // Upload new images if provided
    let imageUrls = product.images; // keep old images by default
    if (files.length > 0) {
      const uploadedUrls = await Promise.all(files.map(uploadFileToCloudinary));
      imageUrls = uploadedUrls;
    }

    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        title,
        description: description || "",
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        colors,
        sizes,
        images: imageUrls,
      },
    });

    res.status(200).json({ success: true, product: updatedProduct });
  } catch (error) {
    console.error("Error editing product:", error);
    res.status(500).json({ error: "Internal server error", debug: error });
  }
}
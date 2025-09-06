import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";
import { v2 as cloudinary } from "cloudinary";
import formidable, { File, Fields, Files } from "formidable";
import fs from "fs";

export const config = { api: { bodyParser: false } };

// --- TYPES ---
interface ParsedFields {
  title: string;
  description: string;
  price: string;
  quantity: string;
  colors: string[];
  sizes: string[];
  categories: string[];
  condition: string;
  era: string;
}

interface ApiResponse {
  success?: boolean;
  productId?: string;
  error?: string;
  detail?: string;
}

// --- FORM PARSING ---
const parseForm = (req: NextApiRequest): Promise<{ fields: ParsedFields; files: File[] }> =>
  new Promise((resolve, reject) => {
    const form = formidable({ multiples: true, keepExtensions: true });

    form.parse(req, (err, fields: Fields, files: Files) => {
      if (err) return reject(err);

      const uploadedFiles: File[] = [];
      if (files.images) {
        if (Array.isArray(files.images)) uploadedFiles.push(...(files.images as File[]));
        else uploadedFiles.push(files.images as File);
      }

      const safeFields: ParsedFields = {
        title: fields.title?.toString() || "",
        description: fields.description?.toString() || "",
        price: fields.price?.toString() || "0",
        quantity: fields.quantity?.toString() || "1",
        colors: (() => {
          try {
            return JSON.parse(fields.colors?.toString() || "[]");
          } catch {
            return [];
          }
        })(),
        sizes: (() => {
          try {
            return JSON.parse(fields.sizes?.toString() || "[]");
          } catch {
            return [];
          }
        })(),
        categories: (() => {
          try {
            return JSON.parse(fields.categories?.toString() || "[]");
          } catch {
            return [];
          }
        })(),
        condition: fields.condition?.toString() || "",
        era: fields.era?.toString() || "",
      };

      resolve({ fields: safeFields, files: uploadedFiles });
    });
  });

// --- CLOUDINARY UPLOAD ---
const uploadFileToCloudinary = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    if (!file.filepath) return reject(new Error("Filepath missing"));

    const stream = cloudinary.uploader.upload_stream({ folder: "products" }, (err, result) => {
      if (err || !result?.secure_url) return reject(err || new Error("Upload failed"));
      resolve(result.secure_url);
    });

    fs.createReadStream(file.filepath).pipe(stream);
  });

// --- API HANDLER ---
export default async function handler(req: NextApiRequest, res: NextApiResponse<ApiResponse>) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { fields, files } = await parseForm(req);
    const { title, description, price, quantity, colors, sizes, categories, condition, era } = fields;

    if (!title || !price || !quantity) {
      return res.status(400).json({ error: "Missing required fields" });
    }
    if (!files.length) {
      return res.status(400).json({ error: "At least one image is required" });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) return res.status(401).json({ error: "User ID not found in session" });

    const imageUrls = await Promise.all(
      files.map(async (file) => {
        try {
          return await uploadFileToCloudinary(file);
        } catch (err) {
          console.error("Cloudinary upload failed:", file.originalFilename, err);
          throw new Error(`Failed to upload ${file.originalFilename}`);
        }
      })
    );

    const product = await prisma.product.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        colors,
        sizes,
        condition,
        era,
        ownerId: userId,
        images: imageUrls,
      },
    });

    if (categories.length) {
      await Promise.all(
        categories.map((catId: string) =>
          prisma.productCategory.create({
            data: { productId: product.id, categoryId: catId },
          })
        )
      );
    }

    res.status(201).json({ success: true, productId: product.id });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    console.error("Product creation failed:", message);
    res.status(500).json({ error: "Internal server error", detail: message });
  }
}
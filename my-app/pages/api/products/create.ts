import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";
import { v2 as cloudinary } from "cloudinary";
import formidable, { File, Fields, Files } from "formidable";
import fs from "fs";

export const config = { api: { bodyParser: false } };

// --- TYPES ---
interface FormFields {
  title: string;
  description?: string;
  price: string;
  quantity: string;
  colors?: string[];
  sizes?: string[];
  categories?: string[];
  condition?: string;
  era?: string;
}

// --- HELPERS ---
const normalizeField = (field?: string | string[]): string[] =>
  !field ? [] : Array.isArray(field) ? field.map(String) : [String(field)];

const splitComma = (field?: string[]): string[] =>
  field?.flatMap(f => f.split(",").map(s => s.trim())) || [];

const parseForm = (req: NextApiRequest): Promise<{ fields: FormFields; files: File[] }> =>
  new Promise((resolve, reject) => {
    const form = formidable({ multiples: true });
    form.parse(req, (err, fields: Fields, files: Files) => {
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
        quantity: fields.quantity?.toString() || "1",
        colors: splitComma(normalizeField(fields.colors)),
        sizes: splitComma(normalizeField(fields.sizes)),
        condition: fields.condition?.toString(),
        era: fields.era?.toString(),
        categories: (() => {
          try {
            return JSON.parse(fields.categories?.toString() || "[]");
          } catch {
            return [];
          }
        })(),
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

// --- HANDLER ---
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { fields, files } = await parseForm(req);
    const { title, description, price, quantity, colors, sizes, categories, condition, era } = fields;

    // Required fields check
    if (!title || !price || !quantity) {
      return res.status(400).json({ error: "Missing required fields", debug: fields });
    }

    if (!files.length) {
      return res.status(400).json({ error: "At least one image is required" });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) return res.status(401).json({ error: "User ID not found in session" });

    // Upload images safely
    const imageUrls = await Promise.all(files.map(async file => {
      try {
        return await uploadFileToCloudinary(file);
      } catch (err) {
        console.error("Cloudinary upload failed for file:", file.originalFilename, err);
        throw new Error(`Failed to upload ${file.originalFilename}`);
      }
    }));

    // Create product
    const product = await prisma.product.create({
      data: {
        title,
        description: description || "",
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        colors,
        sizes,
        condition: condition || "",
        era: era || "",
        ownerId: userId,
        // Ensure your schema has an `images` JSON/text field to store URLs
        images: imageUrls,
      },
    });

    // Link categories via join table (if any)
    if (categories?.length) {
      const categoryLinks = categories.map(catId =>
        prisma.productCategory.create({
          data: { productId: product.id, categoryId: catId },
        })
      );
      await Promise.all(categoryLinks);
    }

    res.status(201).json({
      success: true,
      productId: product.id,
      debug: {
        fields,
        fileNames: files.map(f => f.originalFilename),
        imageUrls,
        categoriesLinked: categories,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : JSON.stringify(error);
    console.error("Product creation failed:", message);
    res.status(500).json({ error: "Internal server error", detail: message });
  }
}
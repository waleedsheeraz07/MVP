import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";
import cloudinary from "../../../lib/cloudinary";
import formidable, { File, Files, Fields } from "formidable";
import fs from "fs";

export const config = { api: { bodyParser: false } };

interface FormFields {
  title: string;
  description?: string;
  price: string;
  quantity: string;
  colors?: string[];
  sizes?: string[];
}

// Convert any field into string array
const normalizeField = (field?: string | string[]): string[] =>
  !field ? [] : Array.isArray(field) ? field.map(String) : [String(field)];

// Split comma-separated string into array
const splitComma = (field?: string[]): string[] =>
  field?.flatMap((f) => f.split(",").map((s) => s.trim())) || [];

const parseForm = (
  req: NextApiRequest
): Promise<{ fields: FormFields; files: File[] }> =>
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
        quantity: fields.quantity?.toString() || "0",
        colors: splitComma(normalizeField(fields.colors)),
        sizes: splitComma(normalizeField(fields.sizes)),
      };

      resolve({ fields: safeFields, files: uploadedFiles });
    });
  });

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

  try {
    const { fields, files } = await parseForm(req);
    const { title, description, price, quantity, colors, sizes } = fields;

    if (!title || !price || !quantity) {
      return res.status(400).json({ error: "Missing required fields", debug: fields });
    }

    if (!files.length) {
      return res.status(400).json({ error: "At least one image is required" });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) return res.status(401).json({ error: "User ID not found in session" });

    const imageUrls = await Promise.all(files.map(uploadFileToCloudinary));

    const product = await prisma.product.create({
      data: {
        title,
        description: description || "",
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        colors,
        sizes,
        ownerId: userId,
        images: imageUrls,
      },
    });

    res.status(201).json({ success: true, productId: product.id, debug: { fields, fileNames: files.map(f => f.originalFilename), imageUrls } });
  } catch (error: unknown) {
  const message = error instanceof Error ? error.message : JSON.stringify(error);
  res.status(500).json({ error: "Internal server error", detail: message });
}
}
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";
import cloudinary from "../../../lib/cloudinary";
import formidable, { Files, Fields, File } from "formidable";
import fs from "fs";

// Disable Next.js default body parsing
export const config = {
  api: {
    bodyParser: false,
  },
};

interface FormFields {
  title: string;
  description?: string;
  price: string;
  quantity: string;
  colors?: string[];
  sizes?: string[];
}

const parseForm = (
  req: NextApiRequest
): Promise<{ fields: FormFields; files: File[] }> => {
  return new Promise((resolve, reject) => {
    const form = formidable({ multiples: true });

    form.parse(req, (err, fields: Fields, files: Files) => {
      if (err) return reject(err);

      const uploadedFiles: File[] = [];
      if (files.images) {
        if (Array.isArray(files.images)) {
          uploadedFiles.push(...(files.images as File[]));
        } else {
          uploadedFiles.push(files.images as File);
        }
      }

      // Safe mapping: ensure all fields are properly coerced into expected types
      const safeFields: FormFields = {
        title: fields.title?.toString() || "",
        description: fields.description?.toString(),
        price: fields.price?.toString() || "0",
        quantity: fields.quantity?.toString() || "0",
        colors: Array.isArray(fields.colors)
          ? fields.colors.map((c) => c.toString())
          : fields.colors
          ? [fields.colors.toString()]
          : [],
        sizes: Array.isArray(fields.sizes)
          ? fields.sizes.map((s) => s.toString())
          : fields.sizes
          ? [fields.sizes.toString()]
          : [],
      };

      resolve({ fields: safeFields, files: uploadedFiles });
    });
  });
};

const uploadFileToCloudinary = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "products" },
      (error, result) => {
        if (error) return reject(error);
        resolve(result?.secure_url || "");
      }
    );

    fs.createReadStream(file.filepath).pipe(uploadStream);
  });
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { fields, files } = await parseForm(req);
    const { title, description, price, quantity, colors = [], sizes = [] } =
      fields;

    if (!title || !price || !quantity) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const imageUrls = await Promise.all(files.map(uploadFileToCloudinary));

    const product = await prisma.product.create({
      data: {
        title,
        description: description || "",
        price: parseFloat(price),
        quantity: parseInt(quantity, 10),
        colors,
        sizes,
        ownerId: (session.user as { id: string }).id,
        images: imageUrls,
      },
    });

    res.status(201).json({ success: true, productId: product.id });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
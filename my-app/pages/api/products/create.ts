// src/pages/api/products/create.ts
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../lib/prisma"; // Prisma client
import cloudinary from "../../lib/cloudinary";
import multer from "multer";

// Extend request for multer files
interface MulterNextApiRequest extends NextApiRequest {
  files: Express.Multer.File[];
}

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage }).array("images");

export const config = {
  api: {
    bodyParser: false, // Multer handles multipart
  },
};

// Wrap multer into a promise for async/await
const runMiddleware = (req: NextApiRequest, res: NextApiResponse) =>
  new Promise<Express.Multer.File[]>((resolve, reject) => {
    upload(req as any, res as any, (err: any) => {
      if (err) return reject(err);
      resolve((req as MulterNextApiRequest).files || []);
    });
  });

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  try {
    const files = await runMiddleware(req, res);
    const { title, description, price, quantity } = req.body;
    const colors = req.body["colors[]"] || [];
    const sizes = req.body["sizes[]"] || [];

    if (!title || !price || !quantity) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Upload images to Cloudinary
    const uploadImage = (file: Express.Multer.File) =>
      new Promise<string>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "products" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result?.secure_url || "");
          }
        );
        stream.end(file.buffer);
      });

    const imageUrls = await Promise.all(files.map(uploadImage));

    // Create product using Prisma
    const product = await prisma.product.create({
      data: {
        title,
        description: description || "",
        price: parseFloat(price),
        quantity: parseInt(quantity),
        colors: Array.isArray(colors) ? colors : [colors],
        sizes: Array.isArray(sizes) ? sizes : [sizes],
        ownerId: session.user.id,
        images: imageUrls,
      },
    });

    res.status(201).json({ success: true, productId: product.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}
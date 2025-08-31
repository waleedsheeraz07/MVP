import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../lib/prisma";
import cloudinary from "../../lib/cloudinary";
import multer from "multer";

// Extend NextApiRequest to include Multer files
interface MulterNextApiRequest extends NextApiRequest {
  files: Express.Multer.File[];
}

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage }).array("images");

export const config = {
  api: {
    bodyParser: false,
  },
};

// Wrap multer in a typed promise
const runMiddleware = (req: MulterNextApiRequest, res: NextApiResponse): Promise<Express.Multer.File[]> => {
  return new Promise((resolve, reject) => {
    upload(req, res, (err: unknown) => {
      if (err) return reject(err);
      resolve(req.files || []);
    });
  });
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  try {
    const files = await runMiddleware(req as MulterNextApiRequest, res);

    const { title, description, price, quantity } = req.body;
    const colors = Array.isArray(req.body["colors[]"]) ? req.body["colors[]"] : [req.body["colors[]"]].filter(Boolean);
    const sizes = Array.isArray(req.body["sizes[]"]) ? req.body["sizes[]"] : [req.body["sizes[]"]].filter(Boolean);

    if (!title || !price || !quantity) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Upload images to Cloudinary
    const uploadImage = (file: Express.Multer.File): Promise<string> =>
      new Promise((resolve, reject) => {
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

    // Save product in Prisma
    const product = await prisma.product.create({
      data: {
        title,
        description: description || "",
        price: parseFloat(price),
        quantity: parseInt(quantity),
        colors,
        sizes,
        ownerId: session.user.id,
        images: imageUrls,
      },
    });

    res.status(201).json({ success: true, productId: product.id });
  } catch (error: unknown) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}
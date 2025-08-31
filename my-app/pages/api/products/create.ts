import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";
import cloudinary from "../../../lib/cloudinary";

interface Base64Image {
  base64: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { title, description, price, quantity, colors = [], sizes = [], images = [] } = req.body;

    if (!title || !price || !quantity) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Upload Base64 images to Cloudinary
    const uploadBase64Image = async (base64: string) => {
      const matches = base64.match(/^data:(.+);base64,(.+)$/);
      if (!matches) throw new Error("Invalid image format");

      const buffer = Buffer.from(matches[2], "base64");

      return new Promise<string>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: "products" },
          (error, result) => {
            if (error) return reject(error);
            resolve(result?.secure_url || "");
          }
        );
        stream.end(buffer);
      });
    };

    const imageUrls = await Promise.all(images.map(uploadBase64Image));

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
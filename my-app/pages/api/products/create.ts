import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";
import cloudinary from "../../../lib/cloudinary";

// Expect the frontend to send:
// { title, description, price, quantity, colors: string[], sizes: string[], images: string[] }
// Where `images` are either Base64 strings or already uploaded Cloudinary URLs

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { title, description, price, quantity, colors = [], sizes = [], images = [] } = req.body;

    if (!title || !price || !quantity) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Upload Base64 images to Cloudinary if needed
    const uploadImage = async (img: string): Promise<string> => {
      // if the img is already a Cloudinary URL, just return it
      if (img.startsWith("http")) return img;

      const uploadResult = await cloudinary.uploader.upload(img, { folder: "products" });
      return uploadResult.secure_url;
    };

    const imageUrls = await Promise.all(images.map(uploadImage));

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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}
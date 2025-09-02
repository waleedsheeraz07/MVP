import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") return res.status(405).json({ error: "Method not allowed" });

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { productId } = req.query;
    if (!productId || typeof productId !== "string") return res.status(400).json({ error: "Invalid or missing productId" });

    const userId = (session.user as { id?: string }).id;
    if (!userId) return res.status(401).json({ error: "User ID not found in session" });

    // Fetch product
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: "Product not found" });
    if (product.ownerId !== userId) return res.status(403).json({ error: "Forbidden – not your product" });

    // Delete images from Cloudinary if public IDs exist
    if (product.images && product.images.length > 0) {
      await Promise.all(
        product.images.map(async (imgUrl) => {
          // Optional: extract public_id from URL if stored differently
          const publicIdMatch = imgUrl.match(/\/v\d+\/(.+)\.(jpg|png|jpeg|webp)$/);
          if (publicIdMatch) {
            const publicId = publicIdMatch[1];
            try {
              await cloudinary.uploader.destroy(publicId);
            } catch (err) {
              console.error("Failed to delete Cloudinary image:", imgUrl, err);
            }
          }
        })
      );
    }

    // Delete product categories
    await prisma.productCategory.deleteMany({ where: { productId } });

    // Delete product
    await prisma.product.delete({ where: { id: productId } });

    return res.status(200).json({ success: true, message: "Product and images deleted successfully" });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : JSON.stringify(err);
    return res.status(500).json({ error: "Internal server error", detail: message });
  }
}
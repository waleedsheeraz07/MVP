import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session) return res.status(401).json({ error: "Unauthorized" });

  try {
    const { id } = req.query;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    const productId = Number(id);
    if (isNaN(productId)) {
      return res.status(400).json({ error: "Invalid Product ID" });
    }

    // Check product exists
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) return res.status(404).json({ error: "Product not found" });

    // Check ownership
    const userId = (session.user as { id?: string }).id;
    if (!userId) return res.status(401).json({ error: "User ID not found in session" });
    if (product.ownerId !== userId) {
      return res.status(403).json({ error: "Forbidden: You don’t own this product" });
    }

    // Delete related categories first (join table cleanup)
    await prisma.productCategory.deleteMany({
      where: { productId },
    });

    // Delete product itself
    await prisma.product.delete({
      where: { id: productId },
    });

    return res.status(200).json({ success: true, message: "Product deleted successfully" });
  } catch (error: unknown) {
    console.error("Delete error:", error);
    const message = error instanceof Error ? error.message : JSON.stringify(error);
    return res.status(500).json({ error: "Internal server error", detail: message });
  }
}
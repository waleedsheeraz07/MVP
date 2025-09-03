// pages/api/useritem/move-to-cart.ts
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const { itemId } = req.body;
  if (!itemId) return res.status(400).json({ message: "Missing itemId" });

  try {
    // Fetch the item to ensure it belongs to the user and is in wishlist
    const item = await prisma.userItem.findUnique({
      where: { id: itemId },
      include: { product: true },
    });

    if (!item || item.userId !== session.user.id || item.status !== "wishlist") {
      return res.status(404).json({ message: "Item not found in wishlist" });
    }

    // Update the status to "cart"
    await prisma.userItem.update({
      where: { id: itemId },
      data: { status: "cart" },
    });

    return res.status(200).json({ message: "Moved to cart successfully" });
  } catch (error) {
    console.error("Move to cart error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { prisma } from "../../../lib/prisma";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { itemId, quantity } = req.body;

  if (!itemId || typeof quantity !== "number") {
    return res.status(400).json({ error: "Invalid data" });
  }

  try {
    // Fetch the item to check ownership and product stock
    const userItem = await prisma.userItem.findUnique({
      where: { id: itemId },
      include: { product: true },
    });

    if (!userItem) return res.status(404).json({ error: "Item not found" });
    if (userItem.userId !== session.user.id) return res.status(403).json({ error: "Forbidden" });

    // Enforce stock limits
    if (quantity < 1 || quantity > userItem.product.quantity) {
      return res.status(400).json({ error: `Quantity must be between 1 and ${userItem.product.quantity}` });
    }

    const updated = await prisma.userItem.update({
      where: { id: itemId },
      data: { quantity },
    });

    res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}
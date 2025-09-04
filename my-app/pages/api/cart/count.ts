import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { userId } = req.query;

    if (!userId || typeof userId !== "string") {
      // Guest users have 0 cart items
      return res.status(200).json({ count: 0 });
    }

    // Sum quantities of all items in the cart for this user
    const result = await prisma.userItem.aggregate({
      _sum: { quantity: true },
      where: { userId, status: "cart" },
    });

    const totalCount = result._sum.quantity ?? 0;

    return res.status(200).json({ count: totalCount });
  } catch (error) {
    console.error("Cart count API error:", error);
    return res.status(500).json({ count: 0 });
  }
}
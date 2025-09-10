import { prisma } from "../../../lib/prisma";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { userId, guestCart } = req.body;

  if (!userId || !guestCart || !Array.isArray(guestCart))
    return res.status(400).json({ error: "Missing required fields" });

  try {
    for (const item of guestCart) {
      const existing = await prisma.userItem.findFirst({
        where: {
          userId,
          productId: item.productId,
          color: item.color || null,
          size: item.size || null,
          status: "cart",
        },
      });

      if (existing) {
        // Merge quantities but respect product stock
        const product = await prisma.product.findUnique({ where: { id: item.productId } });
        if (!product) continue;

        await prisma.userItem.update({
          where: { id: existing.id },
          data: {
            quantity: Math.min(existing.quantity + item.quantity, product.quantity),
          },
        });
      } else {
        // Add new item to DB cart
        await prisma.userItem.create({
          data: {
            userId,
            productId: item.productId,
            color: item.color || null,
            size: item.size || null,
            quantity: item.quantity,
            status: "cart",
            price: item.price,
            image: item.image || null,
          },
        });
      }
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}
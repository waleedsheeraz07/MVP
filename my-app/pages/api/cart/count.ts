// pages/api/cart/count.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

type Data = {
  count: number;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.id) {
      return res.status(200).json({ count: 0 });
    }

    const cartItems = await prisma.userItem.findMany({
      where: { userId: session.user.id, status: "cart" },
      include: { product: true },
    });

    // Enforce quantity does not exceed product stock
    for (const item of cartItems) {
      if (item.quantity > item.product.quantity) {
        await prisma.userItem.update({
          where: { id: item.id },
          data: { quantity: item.product.quantity },
        });
        item.quantity = item.product.quantity;
      }
    }

    const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return res.status(200).json({ count: totalCount });
  } catch (err) {
    console.error("Cart count API error:", err);
    return res.status(500).json({ count: 0 });
  }
}
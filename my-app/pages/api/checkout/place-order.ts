import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "POST") {
    const { address, phoneNumber, name, payment } = req.body;

    try {
      // Fetch user's cart
      const cartItems = await prisma.userItem.findMany({
        where: { userId: session.user.id, status: "cart" },
        include: { product: true },
      });

      if (!cartItems.length) return res.status(400).json({ error: "Cart is empty" });

      // Calculate total
      const total = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

      // Create order
      const order = await prisma.order.create({
        data: {
          userId: session.user.id,
          address,
          phoneNumber,
          total,
          payment: payment,
          status: "PENDING",
          items: {
            create: cartItems.map((item) => ({
              productId: item.product.id,
              sellerId: item.product.ownerId,
              quantity: item.quantity,
              price: item.product.price,
              color: item.color,
              size: item.size,
            })),
          },
        },
      });

      // Clear user's cart
      await prisma.userItem.updateMany({
        where: { userId: session.user.id, status: "cart" },
        data: { status: "ordered" },
      });

      res.status(200).json({ orderId: order.id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Server error" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
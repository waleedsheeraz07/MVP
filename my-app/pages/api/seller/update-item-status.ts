import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });

  const { itemId, status } = req.body;

  if (!["SHIPPED", "DELIVERED"].includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    // Only allow seller to update their own order item
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: itemId },
      select: { sellerId: true, orderId: true },
    });

    if (!orderItem || orderItem.sellerId !== session.user.id) {
      return res.status(403).json({ error: "Not your order item" });
    }

    // Update the item status
    await prisma.orderItem.update({
      where: { id: itemId },
      data: { status },
    });

    // --- Auto-sync parent order status ---
    const items = await prisma.orderItem.findMany({
      where: { orderId: orderItem.orderId },
      select: { status: true },
    });

    let newOrderStatus: string = "PENDING";

    if (items.every((i) => i.status === "CANCELLED")) newOrderStatus = "CANCELLED";
    else if (items.every((i) => i.status === "DELIVERED")) newOrderStatus = "DELIVERED";
    else if (items.every((i) => i.status === "SHIPPED")) newOrderStatus = "SHIPPED";
    else if (items.every((i) => i.status === "CONFIRMED")) newOrderStatus = "CONFIRMED";
    else if (items.some((i) => i.status === "CANCELLED")) newOrderStatus = "CANCELLED";
    else newOrderStatus = "PENDING"; // default

    await prisma.order.update({
      where: { id: orderItem.orderId },
      data: { status: newOrderStatus },
    });

    return res.status(200).json({ success: true, orderStatus: newOrderStatus });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
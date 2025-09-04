// pages/api/seller/update-item-status.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { ItemStatus, OrderStatus } from "@prisma/client";

type ResponseData =
  | { success: true; orderStatus: OrderStatus }
  | { error: string };

const statusRank: Record<ItemStatus, number> = {
  PENDING: 0,
  CONFIRMED: 1,
  SHIPPED: 2,
  DELIVERED: 3,
  CANCELLED: -1, // special case
};

const orderFromRank: Record<number, OrderStatus> = {
  0: OrderStatus.PENDING,
  1: OrderStatus.CONFIRMED,
  2: OrderStatus.SHIPPED,
  3: OrderStatus.DELIVERED,
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id)
    return res.status(401).json({ error: "Unauthorized" });

  const { itemId, status } = req.body;

  // Only allow valid updates
  const validStatuses: ItemStatus[] = [
    ItemStatus.CONFIRMED,
    ItemStatus.SHIPPED,
    ItemStatus.DELIVERED,
  ];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    // Check ownership
    const orderItem = await prisma.orderItem.findUnique({
      where: { id: itemId },
      select: { sellerId: true, orderId: true },
    });

    if (!orderItem || orderItem.sellerId !== session.user.id) {
      return res.status(403).json({ error: "Not your order item" });
    }

    // Update item
    await prisma.orderItem.update({
      where: { id: itemId },
      data: { status },
    });

    // Fetch all items for this order
    const items = await prisma.orderItem.findMany({
      where: { orderId: orderItem.orderId },
      select: { status: true },
    });

    // Handle cancellation (if any item is cancelled → order cancelled)
    if (items.every((i) => i.status === ItemStatus.CANCELLED)) {
      await prisma.order.update({
        where: { id: orderItem.orderId },
        data: { status: OrderStatus.CANCELLED },
      });
      return res
        .status(200)
        .json({ success: true, orderStatus: OrderStatus.CANCELLED });
    }

    // Find the minimum progression rank across all items
    const minRank = Math.min(...items.map((i) => statusRank[i.status]));

    // Map back to order status
    const newOrderStatus = orderFromRank[minRank] || OrderStatus.PENDING;

    await prisma.order.update({
      where: { id: orderItem.orderId },
      data: { status: newOrderStatus },
    });

    return res
      .status(200)
      .json({ success: true, orderStatus: newOrderStatus });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}
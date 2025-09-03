// pages/api/seller/update-item-status.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { ItemStatus, OrderStatus } from "@prisma/client";

type ResponseData = { success: true; orderStatus: OrderStatus } | { error: string };

export default async function handler(req: NextApiRequest, res: NextApiResponse<ResponseData>) {
  if (req.method !== "POST") {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return res.status(401).json({ error: "Unauthorized" });

  const { itemId, status } = req.body;

  // Validate status
  const validStatuses: ItemStatus[] = [ItemStatus.SHIPPED, ItemStatus.DELIVERED];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  try {
    // Ensure the seller owns this item
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

    // Fetch all items in the order to auto-sync parent order status
    const items = await prisma.orderItem.findMany({
      where: { orderId: orderItem.orderId },
      select: { status: true },
    });

    let newOrderStatus: OrderStatus;

    if (items.every(i => i.status === ItemStatus.CANCELLED)) newOrderStatus = OrderStatus.CANCELLED;
    else if (items.every(i => i.status === ItemStatus.DELIVERED)) newOrderStatus = OrderStatus.DELIVERED;
    else if (items.every(i => i.status === ItemStatus.SHIPPED)) newOrderStatus = OrderStatus.SHIPPED;
    else if (items.every(i => i.status === ItemStatus.CONFIRMED)) newOrderStatus = OrderStatus.CONFIRMED;
    else if (items.some(i => i.status === ItemStatus.CANCELLED)) newOrderStatus = OrderStatus.CANCELLED;
    else newOrderStatus = OrderStatus.PENDING;

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
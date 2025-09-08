// pages/api/users/delete.ts:
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
  if (!session || session.user.role !== "ADMIN") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Missing user ID" });

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1️⃣ Ensure deleted_user exists
      let deletedUser = await tx.user.findUnique({
        where: { email: "deleted_user@example.com" },
      });

      if (!deletedUser) {
        deletedUser = await tx.user.create({
          data: {
            email: "deleted_user@example.com",
            password: "deleted", // dummy
            role: "DELETED",
            firstName: "Deleted",
            lastName: "User",
          },
        });
      }

      // 2️⃣ Update products: set quantity = 0 and reassign owner
      await tx.product.updateMany({
        where: { ownerId: id },
        data: { quantity: 0, ownerId: deletedUser.id },
      });

      // 3️⃣ Reassign orderItems
      await tx.orderItem.updateMany({
        where: { sellerId: id },
        data: { sellerId: deletedUser.id },
      });

      // 4️⃣ Handle userItems
      await tx.userItem.deleteMany({
        where: { userId: id, status: { in: ["cart", "wishlist"] } },
      });

      await tx.userItem.updateMany({
        where: { userId: id, status: { notIn: ["cart", "wishlist"] } },
        data: { userId: deletedUser.id },
      });

      // 5️⃣ Reassign past orders
      await tx.order.updateMany({
        where: { userId: id },
        data: { userId: deletedUser.id },
      });

      // 6️⃣ Finally delete the user
      await tx.user.delete({ where: { id } });

      return { success: true };
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("Delete user failed:", err);
    return res.status(500).json({ error: "Failed to delete user" });
  }
}
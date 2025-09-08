// pages/api/profile/delete.ts:
// pages/api/users/self-delete.ts
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
  if (!session || !session.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const userId = session.user.id;

  try {
    const result = await prisma.$transaction(async (tx) => {
      // 1️⃣ Find or create the placeholder "deleted_user"
      let deletedUser = await tx.user.findUnique({
        where: { email: "deleted_user@example.com" },
      });

      if (!deletedUser) {
        deletedUser = await tx.user.create({
          data: {
            email: "deleted_user@example.com",
            password: "deleted", // dummy placeholder
            role: "DELETED",
            firstName: "Deleted",
            lastName: "User",
          },
        });
      }

      // 2️⃣ Update products: set quantity = 0 and reassign owner
      await tx.product.updateMany({
        where: { ownerId: userId },
        data: { quantity: 0, ownerId: deletedUser.id },
      });

      // 3️⃣ Reassign related records to deleted_user
      await tx.orderItem.updateMany({
        where: { sellerId: userId },
        data: { sellerId: deletedUser.id },
      });

      await tx.userItem.updateMany({
        where: { userId, NOT: { status: { in: ["cart", "wishlist"] } } },
        data: { userId: deletedUser.id },
      });

      await tx.order.updateMany({
        where: { userId },
        data: { userId: deletedUser.id },
      });

      // 4️⃣ Delete all userItems in cart or wishlist
      await tx.userItem.deleteMany({
        where: { userId, status: { in: ["cart", "wishlist"] } },
      });

      // 5️⃣ Finally, delete the user
      await tx.user.delete({ where: { id: userId } });

      return { success: true };
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("Self-delete failed:", err);
    return res.status(500).json({ error: "Failed to delete account" });
  }
}
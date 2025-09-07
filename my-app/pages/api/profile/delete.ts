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
    // 1️⃣ Find or create the placeholder "deleted_user"
    let deletedUser = await prisma.user.findUnique({ where: { email: "deleted_user@example.com" } });
    if (!deletedUser) {
      deletedUser = await prisma.user.create({
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
    await prisma.product.updateMany({
      where: { ownerId: userId },
      data: { quantity: 0, ownerId: deletedUser.id },
    });

    // 3️⃣ Reassign related records to deleted_user
    await prisma.orderItem.updateMany({
      where: { sellerId: userId },
      data: { sellerId: deletedUser.id },
    });

    await prisma.userItem.updateMany({
      where: { userId },
      data: { userId: deletedUser.id },
    });

    await prisma.order.updateMany({
      where: { userId },
      data: { userId: deletedUser.id },
    });

    // 4️⃣ Delete the user
    await prisma.user.delete({ where: { id: userId } });

    // 5️⃣ End session (user is now deleted)
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Self-delete failed:", err);
    return res.status(500).json({ error: "Failed to delete account" });
  }
}
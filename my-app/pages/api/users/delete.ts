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
      where: { ownerId: id },
      data: { quantity: 0, ownerId: deletedUser.id },
    });

    // 3️⃣ Reassign related records to deleted_user
    await prisma.orderItem.updateMany({
      where: { sellerId: id },
      data: { sellerId: deletedUser.id },
    });

    await prisma.userItem.updateMany({
      where: { userId: id },
      data: { userId: deletedUser.id },
    });

    await prisma.order.updateMany({
      where: { userId: id },
      data: { userId: deletedUser.id },
    });

    // 4️⃣ Delete the user
    await prisma.user.delete({ where: { id } });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Delete user failed:", err);
    return res.status(500).json({ error: "Failed to delete user" });
  }
}
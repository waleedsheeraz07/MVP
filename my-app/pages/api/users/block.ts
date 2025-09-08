// pages/api/users/block.ts
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
    // Prevent blocking self
    if (id === session.user.id) {
      return res.status(400).json({ error: "Cannot block yourself" });
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1️⃣ Set all of this user's products quantity to 0
      await tx.product.updateMany({
        where: { ownerId: id },
        data: { quantity: 0 },
      });

      // 2️⃣ Delete all userItems in cart or wishlist
      await tx.userItem.deleteMany({
        where: {
          userId: id,
          status: { in: ["cart", "wishlist"] },
        },
      });

      // 3️⃣ Update user's role to BLOCKED
      await tx.user.update({
        where: { id },
        data: { role: "BLOCKED" },
      });

      return { success: true };
    });

    return res.status(200).json(result);
  } catch (err) {
    console.error("Block user failed:", err);
    return res.status(500).json({ error: "Failed to block user" });
  }
}
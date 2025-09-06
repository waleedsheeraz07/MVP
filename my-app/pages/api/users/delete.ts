import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { ObjectId } from "mongodb";

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
    // Ensure ObjectId
    const userId = new ObjectId(id);

    // 1️⃣ Set all products from this user to quantity = 0
    await prisma.product.updateMany({
      where: { ownerId: id },
      data: { quantity: 0 },
    });

    // 2️⃣ Delete the user
    await prisma.user.delete({
      where: { id: id },
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Delete user failed:", err);
    return res.status(500).json({ error: "Failed to delete user" });
  }
}
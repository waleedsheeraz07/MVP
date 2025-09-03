import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { prisma } from "../../../lib/prisma";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { itemId } = req.body;

  if (!itemId) {
    return res.status(400).json({ error: "Item ID required" });
  }

  try {
    const userItem = await prisma.userItem.findUnique({
      where: { id: itemId },
    });

    if (!userItem) return res.status(404).json({ error: "Item not found" });
    if (userItem.userId !== session.user.id) return res.status(403).json({ error: "Forbidden" });

    await prisma.userItem.delete({
      where: { id: itemId },
    });

    res.status(200).json({ message: "Item removed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
}
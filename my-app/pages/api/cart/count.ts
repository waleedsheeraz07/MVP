import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma"; // Adjust if your prisma path is different
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.email) {
      // Guest users have 0 cart items
      return res.status(200).json({ count: 0 });
    }

    const userEmail = session.user.email;

    // Find the user first
    const user = await prisma.user.findUnique({
      where: { email: userEmail },
      select: { id: true },
    });

    if (!user) return res.status(200).json({ count: 0 });

    // Sum quantities of all items in the cart
    const totalCount = await prisma.userItem.aggregate({
      _sum: { quantity: true },
      where: { userId: user.id, status: "cart" },
    });

    return res.status(200).json({ count: totalCount._sum.quantity || 0 });
  } catch (err) {
    console.error("Error fetching cart count:", err);
    return res.status(500).json({ count: 0 });
  }
}
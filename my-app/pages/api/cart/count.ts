import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const session = await getServerSession(req, res, authOptions);

    if (!session?.user?.email) {
      return res.status(200).json({ count: 0 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return res.status(200).json({ count: 0 });
    }

    // Make sure `_sum` is always handled safely
    const result = await prisma.userItem.aggregate({
      _sum: { quantity: true },
      where: { userId: user.id, status: "cart" },
    });

    const totalCount = result._sum.quantity ?? 0;

    return res.status(200).json({ count: totalCount });
  } catch (error) {
    console.error("Cart count API error:", error);
    return res.status(500).json({ count: 0 });
  }
}
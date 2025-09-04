import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma"; // Adjust if prisma path is different
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);

  if (!session?.user?.email) {
    return res.status(200).json({ count: 0 }); // Guest users have 0 cart items
  }

  const userEmail = session.user.email;

  try {
    const cartItems = await prisma.cartItem.findMany({
      where: { user: { email: userEmail } },
      select: { quantity: true },
    });

    const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return res.status(200).json({ count: totalCount });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ count: 0 });
  }
}
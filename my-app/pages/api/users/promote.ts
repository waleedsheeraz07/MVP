// pages/api/users/promote.ts
import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Unauthorized" });
  }

  const { id } = req.body;
  if (!id) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: "MANAGER" },
    });

    return res.status(200).json({ message: "User promoted to Manager", user: updatedUser });
  } catch (error) {
    console.error("Error promoting user:", error);
    return res.status(500).json({ error: "Failed to promote user" });
  }
}

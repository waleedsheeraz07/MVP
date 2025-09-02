import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "PUT") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { id, title } = req.body;

    if (!id || !title) return res.status(400).json({ error: "ID and title are required" });

    const updated = await prisma.category.update({
      where: { id },
      data: { title },
    });

    res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update category" });
  }
}
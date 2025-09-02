import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { title, parentId } = req.body;

    if (!title) return res.status(400).json({ error: "Title is required" });

    const category = await prisma.category.create({
      data: {
        title,
        parentId: parentId || null,
      },
    });

    res.status(200).json(category);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create category" });
  }
}
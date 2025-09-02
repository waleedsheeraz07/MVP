import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { parent, order } = req.body as {
      parent: string | null; // parentId of these siblings, null if top-level
      order: { id: string; order: number }[];
    };

    if (!Array.isArray(order)) return res.status(400).json({ error: "Invalid order array" });

    // update all siblings in parallel
    await Promise.all(
      order.map(item =>
        prisma.category.update({
          where: { id: item.id },
          data: { order: item.order },
        })
      )
    );

    res.status(200).json({ message: "Categories reordered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to reorder categories" });
  }
}
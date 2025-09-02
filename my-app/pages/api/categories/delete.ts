import { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";

async function deleteWithChildren(id: string) {
  // find all children
  const children = await prisma.category.findMany({ where: { parentId: id } });

  // recursively delete children
  for (const child of children) {
    await deleteWithChildren(child.id);
  }

  // delete this category
  await prisma.category.delete({ where: { id } });
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ error: "ID is required" });

    await deleteWithChildren(id);

    res.status(200).json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete category" });
  }
}
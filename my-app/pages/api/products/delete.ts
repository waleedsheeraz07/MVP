// pages/api/products/delete.ts
import { NextApiRequest, NextApiResponse } from "next"
import { getServerSession } from "next-auth/next"
import { authOptions } from "../auth/[...nextauth]"
import { prisma } from "../../../lib/prisma"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const session = await getServerSession(req, res, authOptions)
  if (!session) {
    return res.status(401).json({ error: "Unauthorized" })
  }

  const { id } = req.query
  if (!id || typeof id !== "string") {
    return res.status(400).json({ error: "Product ID is required" })
  }

  try {
    // If your schema has `id Int`, convert string -> number
    const productId = Number(id)

    if (isNaN(productId)) {
      return res.status(400).json({ error: "Invalid product ID" })
    }

    // Optional: verify ownership
    // const product = await prisma.product.findUnique({ where: { id: productId } })
    // if (product?.userId !== session.user.id) return res.status(403).json({ error: "Forbidden" })

    await prisma.product.delete({ where: { id: productId } })

    return res.status(200).json({ message: "Product deleted successfully" })
  } catch (err: any) {
    console.error("Delete error:", err)
    return res.status(500).json({ error: "Failed to delete product" })
  }
}
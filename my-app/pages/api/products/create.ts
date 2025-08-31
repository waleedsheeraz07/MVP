import { NextApiRequest, NextApiResponse } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]";
import { prisma } from "../../lib/prisma"; // make sure prisma client is exported from here

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const session = await getServerSession(req, res, authOptions);

  if (!session) return res.status(401).json({ error: "Unauthorized" });

  if (req.method === "POST") {
    try {
      const { title, description, price, images, colors, sizes, quantity } = req.body;

      const product = await prisma.product.create({
        data: {
          title,
          description: description || "",
          price: parseFloat(price),
          images: images || [],
          colors: colors || [],
          sizes: sizes || [],
          quantity: parseInt(quantity),
          ownerId: session.user.id,
        },
      });

      return res.status(201).json(product);
    } catch (error: any) {
      console.error(error);
      return res.status(500).json({ error: "Failed to create product" });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
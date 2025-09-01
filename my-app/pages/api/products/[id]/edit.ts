import type { NextApiRequest, NextApiResponse } from "next";

// Mock database
const mockDB: Record<string, any> = {
  "1": {
    id: "1",
    title: "Sample Product",
    description: "A demo product",
    price: 100,
    quantity: 10,
    colors: ["red", "blue"],
    sizes: ["M", "L"],
    images: ["/sample1.jpg"],
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  try {
    if (!id || typeof id !== "string") {
      return res.status(400).json({ error: "Invalid product ID" });
    }

    if (req.method === "GET") {
      const product = mockDB[id];
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      return res.status(200).json(product);
    }

    if (req.method === "POST") {
      const { title, description, price, quantity, colors, sizes } = req.body;

      console.log("Update request body:", req.body);

      if (!mockDB[id]) {
        return res.status(404).json({ error: "Product not found" });
      }

      mockDB[id] = {
        ...mockDB[id],
        title,
        description,
        price: Number(price),
        quantity: Number(quantity),
        colors: typeof colors === "string" ? colors.split(",") : [],
        sizes: typeof sizes === "string" ? sizes.split(",") : [],
        images: mockDB[id].images, // keep existing for now
      };

      return res.status(200).json({ success: true, product: mockDB[id] });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: unknown) {
    console.error("Error editing product:", error);

    if (error instanceof Error) {
      res.status(500).json({
        error: "Internal server error",
        debug: { message: error.message, stack: error.stack },
      });
    } else {
      res.status(500).json({
        error: "Internal server error",
        debug: String(error),
      });
    }
  }
}
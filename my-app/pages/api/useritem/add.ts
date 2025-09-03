// pages/api/useritem/add.ts
import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "../../../lib/prisma";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      userId,
      productId,
      color,
      size,
      quantity = 1,
      status, // "cart" or "wishlist"
    } = req.body;

    if (!userId || !productId || !status) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Fetch product to check stock and get first image
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) return res.status(404).json({ error: "Product not found" });

    const firstImage = product.images[0] || null;

    // If status is cart, check quantity against available stock
    let finalQuantity = quantity;
    if (status === "cart") {
      if (quantity > product.quantity) finalQuantity = product.quantity;
      if (product.quantity === 0)
        return res.status(400).json({ error: "Product out of stock" });
    }

    // Check if item already exists for user with same product, color, size, and status
    const existingItem = await prisma.userItem.findFirst({
      where: {
        userId,
        productId,
        color: color || null,
        size: size || null,
        status,
      },
    });

    if (existingItem) {
      // If cart, update quantity
      if (status === "cart") {
        const updatedItem = await prisma.userItem.update({
          where: { id: existingItem.id },
          data: { quantity: Math.min(existingItem.quantity + finalQuantity, product.quantity) },
        });
        return res.status(200).json(updatedItem);
      } else {
        // If wishlist, do nothing (already added)
        return res.status(200).json(existingItem);
      }
    }

    // Create new user item
    const userItem = await prisma.userItem.create({
      data: {
        userId,
        productId,
        color: color || null,
        size: size || null,
        quantity: finalQuantity,
        status,
        price: product.price,
        image: firstImage,
      },
    });

    res.status(201).json(userItem);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
}
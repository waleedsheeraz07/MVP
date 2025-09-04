// lib/cart.ts
import { prisma } from "/prisma"; // adjust path if needed
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";

export async function getCartCount(req: any, res: any) {
  const session = await getServerSession(req, res, authOptions);
  if (!session?.user?.id) return 0;

  const cartItems = await prisma.userItem.findMany({
    where: { userId: session.user.id, status: "cart" },
    include: { product: true },
  });

  // Ensure quantity does not exceed stock
  for (const item of cartItems) {
    if (item.quantity > item.product.quantity) {
      await prisma.userItem.update({
        where: { id: item.id },
        data: { quantity: item.product.quantity },
      });
      item.quantity = item.product.quantity;
    }
  }

  // Count total quantity in cart
  const totalCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  return totalCount;
}
// /pages/seller/orders.tsx
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import { prisma } from "../../lib/prisma";
import { useState } from "react";

interface ProductItem {
  id: string;
  title: string;
  price: number;
  images: string[];
}

interface SellerOrderItem {
  id: string;
  quantity: number;
  price: number;
  color?: string | null;
  size?: string | null;
  status: string;
  product: ProductItem;
}

interface SellerOrder {
  id: string;
  createdAt: string;
  payment: string;
  address: string;
  buyerName: string;
  buyerPhone?: string | null;
  items: SellerOrderItem[];
  total: number;
}

interface SellerOrdersPageProps {
  orders: SellerOrder[];
}

export default function SellerOrdersPage({ orders }: SellerOrdersPageProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleUpdateStatus = async (itemId: string, newStatus: string) => {
    try {
      setUpdatingId(itemId);
      const res = await fetch(`/api/seller/update-item-status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update status");
      window.location.reload();
    } catch (err) {
      alert((err as Error).message || "Something went wrong");
    } finally {
      setUpdatingId(null);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="max-w-5xl mx-auto p-4 min-h-screen">
        <h1 className="text-2xl font-bold mb-4">Orders for My Products</h1>
        <p>No orders yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Orders for My Products</h1>

      <div className="space-y-6">
        {orders.map((order) => (
          <div
            key={order.id}
            className="border rounded p-4 shadow-sm bg-white space-y-4"
          >
            <div className="flex justify-between items-center">
              <h2 className="font-semibold">
                Order #{order.id.slice(0, 8).toUpperCase()}
              </h2>
              <span className="text-sm text-gray-600">
                {new Date(order.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className="text-sm space-y-1">
              <p>
                <strong>Payment:</strong> {order.payment}
              </p>
              <p>
                <strong>Buyer:</strong> {order.buyerName}{" "}
                {order.buyerPhone ? `(${order.buyerPhone})` : ""}
              </p>
              <p>
                <strong>Shipping Address:</strong> {order.address}
              </p>
            </div>

            <div className="space-y-2">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between border p-2 rounded"
                >
                  <div className="flex items-center gap-3">
                    {item.product.images?.[0] && (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <div>
                      <p className="font-medium">{item.product.title}</p>
                      <p className="text-sm text-gray-600">
                        Size: {item.size || "N/A"} | Color:{" "}
                        {item.color || "N/A"}
                      </p>
                      <p className="text-sm text-gray-600">
                        Qty: {item.quantity}
                      </p>
                      <p className="text-sm">
                        Status:{" "}
                        <span className="font-semibold">{item.status}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <p className="font-semibold">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                    <div className="flex gap-2">
                      {item.status === "PENDING" && (
                        <button
                          onClick={() => handleUpdateStatus(item.id, "SHIPPED")}
                          disabled={updatingId === item.id}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                        >
                          {updatingId === item.id ? "Updating..." : "Mark Shipped"}
                        </button>
                      )}
                      {item.status === "SHIPPED" && (
                        <button
                          onClick={() => handleUpdateStatus(item.id, "DELIVERED")}
                          disabled={updatingId === item.id}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          {updatingId === item.id ? "Updating..." : "Mark Delivered"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <div className="font-bold">
                Seller Total: ${order.total.toFixed(2)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ✅ Server-side fetch now pulls item.status
export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session?.user?.id) {
    return {
      redirect: { destination: "/auth/signin", permanent: false },
    };
  }

  const orderItems = await prisma.orderItem.findMany({
    where: { sellerId: session.user.id },
    include: {
      order: { include: { user: true } },
      product: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const orderMap: Record<string, SellerOrder> = {};
  for (const item of orderItems) {
    if (!orderMap[item.orderId]) {
      orderMap[item.orderId] = {
        id: item.orderId,
        createdAt: item.order.createdAt.toISOString(),
        payment: item.order.payment,
        address: item.order.address || "",
        buyerName: `${item.order.user.firstName} ${item.order.user.lastName || ""}`,
        buyerPhone: item.order.user.phoneNumber,
        items: [],
        total: 0,
      };
    }
    orderMap[item.orderId].items.push({
      id: item.id,
      quantity: item.quantity,
      price: item.price,
      color: item.color,
      size: item.size,
      status: item.status,
      product: {
        id: item.product.id,
        title: item.product.title,
        price: item.product.price,
        images: item.product.images,
      },
    });
    orderMap[item.orderId].total += item.price * item.quantity;
  }

  const orders = Object.values(orderMap);

  return { props: { orders } };
};
// pages/seller/orders.tsx
import { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import { prisma } from "../../lib/prisma";
import Layout from "../../components/header";
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

interface Category {
  id: string;
  title: string;
  order: number;
  parentId?: string | null;
}

interface User {
  id: string;
  name?: string | null;
}

interface SellerOrdersPageProps {
  orders: SellerOrder[];
  categories: Category[];
  user: User;
}

// ✅ Status Badge for seller items
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: "bg-gray-200 text-gray-800",
    CONFIRMED: "bg-yellow-200 text-yellow-800",
    SHIPPED: "bg-blue-200 text-blue-800",
    DELIVERED: "bg-green-200 text-green-800",
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${colors[status] || "bg-gray-200 text-gray-800"}`}>
      {status}
    </span>
  );
}

export default function SellerOrdersPage({ orders: initialOrders, categories, user }: SellerOrdersPageProps) {
  const [orders, setOrders] = useState<SellerOrder[]>(initialOrders);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleUpdateStatus = async (itemId: string, newStatus: string) => {
    try {
      setUpdatingId(itemId);
      const res = await fetch("/api/seller/update-item-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed to update status");

      setOrders((prev) =>
        prev.map((order) => ({
          ...order,
          items: order.items.map((item) =>
            item.id === itemId ? { ...item, status: newStatus } : item
          ),
        }))
      );
    } catch (err) {
      alert((err as Error).message || "Something went wrong");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <Layout categories={categories} user={user}>
      <div className="min-h-screen bg-[#fdf8f3] p-4">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-[#3e2f25] text-center sm:text-left">
            Orders for My Products
          </h1>

          {orders.length === 0 ? (
            <p className="text-center text-gray-600">No orders yet.</p>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-[#fffdfb] border rounded-2xl shadow-sm p-4 space-y-4 hover:shadow-md transition-all"
                >
                  {/* Header */}
                  <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-[#3e2f25]">
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </h2>
                    <span className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Buyer Info */}
                  <div className="text-sm space-y-1">
                    <p><strong>Payment:</strong> {order.payment}</p>
                    <p>
                      <strong>Buyer:</strong> {order.buyerName}{" "}
                      {order.buyerPhone ? `(${order.buyerPhone})` : ""}
                    </p>
                    <p><strong>Shipping Address:</strong> {order.address}</p>
                  </div>

                  {/* Items */}
                  <div className="space-y-3">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between border p-2 rounded-lg hover:bg-[#f9f4ec] transition-all"
                      >
                        <div className="flex items-center gap-3">
                          {item.product.images?.[0] && (
                            <img
                              src={item.product.images[0]}
                              alt={item.product.title}
                              className="w-16 h-16 sm:w-20 sm:h-20 object-cover rounded-lg"
                            />
                          )}
                          <div>
                            <p className="font-medium text-[#3e2f25]">{item.product.title}</p>
                            <p className="text-sm text-gray-600">
                              Size: {item.size || "N/A"} | Color: {item.color || "N/A"}
                            </p>
                            <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                            <div className="mt-1">
                              <StatusBadge status={item.status} />
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <p className="font-semibold text-[#3e2f25]">
                            ${(item.price * item.quantity).toFixed(2)}
                          </p>
                          <div className="flex gap-2">
                            {item.status === "PENDING" && (
                              <button
                                onClick={() => handleUpdateStatus(item.id, "CONFIRMED")}
                                disabled={updatingId === item.id}
                                className="px-3 py-1 bg-[#d4b996] text-[#3e2f25] rounded hover:bg-[#c4a57e] disabled:opacity-50 transition"
                              >
                                {updatingId === item.id ? "Updating..." : "Mark Confirmed"}
                              </button>
                            )}
                            {item.status === "CONFIRMED" && (
                              <button
                                onClick={() => handleUpdateStatus(item.id, "SHIPPED")}
                                disabled={updatingId === item.id}
                                className="px-3 py-1 bg-[#5a4436] text-[#fdf8f3] rounded hover:bg-[#3e2f25] disabled:opacity-50 transition"
                              >
                                {updatingId === item.id ? "Updating..." : "Mark Shipped"}
                              </button>
                            )}
                            {item.status === "SHIPPED" && (
                              <button
                                onClick={() => handleUpdateStatus(item.id, "DELIVERED")}
                                disabled={updatingId === item.id}
                                className="px-3 py-1 bg-[#3e2f25] text-[#fdf8f3] rounded hover:bg-[#5a4436] disabled:opacity-50 transition"
                              >
                                {updatingId === item.id ? "Updating..." : "Mark Delivered"}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Total */}
                  <div className="flex justify-end font-bold text-[#3e2f25] text-lg">
                    Seller Total: ${order.total.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

// --- Server-side fetch with categories and user ---
export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session?.user?.id) {
    return { redirect: { destination: "/auth/signin", permanent: false } };
  }

  const orderItems = await prisma.orderItem.findMany({
    where: { sellerId: session.user.id },
    include: {
      order: { include: { user: true } },
      product: true,
    },
    orderBy: { order: { createdAt: "desc" } },
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

  const categories = await prisma.category.findMany({
    select: { id: true, title: true, order: true, parentId: true },
    orderBy: { order: "asc" },
  });

  return {
    props: {
      orders: Object.values(orderMap),
      categories,
      user: { id: session.user.id, name: session.user.name || "Seller" },
    },
  };
};
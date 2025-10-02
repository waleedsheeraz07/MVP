// pages/seller/orders.tsx:
import Head from 'next/head'
import Link from "next/link";
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
  role: string;
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
  <>
    <Head>
      <title>Manage Your Orders | Vintage Marketplace</title>
      <meta name="description" content="Process and manage customer orders for your authentic vintage treasures." />
    </Head>
    
    <Layout categories={categories} user={user}>
      <div className="min-h-screen bg-[#fefaf5] py-8 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#3e2f25] mb-4">
              Manage Your Orders
            </h1>
            <p className="text-lg text-[#5a4436] max-w-2xl mx-auto">
              Process customer orders and track the journey of your vintage treasures
            </p>
          </div>

          {/* Empty State */}
          {orders.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-[#e6d9c6] rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-[#8b4513]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#3e2f25] mb-2">No orders yet</h3>
              <p className="text-[#5a4436] mb-6">Your vintage treasures will appear here when customers place orders</p>
              <Link href="/seller/products">
                <a className="inline-flex items-center space-x-2 px-8 py-3 bg-[#8b4513] text-white rounded-xl font-semibold hover:bg-[#6b3410] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                  <span>Manage Your Products</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </a>
              </Link>
            </div>
          ) : (
            /* Orders List */
            <div className="space-y-6">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-500 hover:scale-105"
                >
                  {/* Order Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 pb-4 border-b border-[#e6d9c6]">
                    <div>
                      <h2 className="text-xl font-bold text-[#3e2f25] mb-2">
                        Order #{order.id.slice(0, 8).toUpperCase()}
                      </h2>
                      <div className="flex items-center space-x-4 text-sm text-[#5a4436]">
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span>{new Date(order.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                          </svg>
                          <span>{order.payment}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Buyer Information */}
                  <div className="bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl p-4 mb-6">
                    <h3 className="font-semibold text-[#3e2f25] text-sm mb-3">Customer Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-[#5a4436]">
                      <div>
                        <p className="font-medium">Buyer Name</p>
                        <p className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>{order.buyerName}</span>
                        </p>
                      </div>
                      {order.buyerPhone && (
                        <div>
                          <p className="font-medium">Contact</p>
                          <p className="flex items-center space-x-1">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span>{order.buyerPhone}</span>
                          </p>
                        </div>
                      )}
                      <div className="sm:col-span-2">
                        <p className="font-medium">Shipping Address</p>
                        <p className="flex items-start space-x-1">
                          <svg className="w-4 h-4 text-[#8b4513] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          </svg>
                          <span>{order.address}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-4 mb-6">
                    <h3 className="text-lg font-semibold text-[#3e2f25] mb-3">Order Items</h3>
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row items-start sm:items-center bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl p-4 hover:shadow-md transition-all duration-300 group/item"
                      >
                        {/* Product Image & Details */}
                        <div className="flex-1 flex items-start sm:items-center gap-4 mb-4 sm:mb-0">
                          {/* Product Image */}
                          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer transform transition-transform duration-300 hover:scale-105">
                            <img
                              src={item.product.images?.[0]}
                              alt={item.product.title}
                              className="w-full h-full object-cover"
                            />
                          </div>

                          {/* Product Details */}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-semibold text-[#3e2f25] truncate hover:text-[#8b4513] transition-colors duration-300 cursor-pointer">
                              {item.product.title}
                            </h4>
                            
                            {/* Item Attributes */}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {item.size && (
                                <span className="text-xs text-[#5a4436] bg-white px-3 py-1 rounded-full border border-[#e6d9c6]">
                                  Size: {item.size}
                                </span>
                              )}
                              {item.color && (
                                <span className="text-xs text-[#5a4436] bg-white px-3 py-1 rounded-full border border-[#e6d9c6]">
                                  Color: {item.color}
                                </span>
                              )}
                              <span className="text-xs text-[#5a4436] bg-white px-3 py-1 rounded-full border border-[#e6d9c6]">
                                Qty: {item.quantity}
                              </span>
                            </div>

                            {/* Item Status */}
                            <div className="mt-2">
                              <StatusBadge status={item.status} />
                            </div>
                          </div>
                        </div>

                        {/* Price & Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-4 w-full sm:w-auto">
                          {/* Price */}
                          <div className="text-right sm:text-left">
                            <p className="text-lg font-bold text-[#8b4513]">
                              KWD {(item.price * item.quantity).toFixed(2)}
                            </p>
                            <p className="text-sm text-[#5a4436] mt-1">
                              KWD {item.price.toFixed(2)} each
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex flex-wrap gap-2">
                            {item.status === "PENDING" && (
                              <button
                                onClick={() => handleUpdateStatus(item.id, "CONFIRMED")}
                                disabled={updatingId === item.id}
                                className="flex items-center space-x-2 px-4 py-2 bg-[#8b4513] text-white rounded-xl font-semibold hover:bg-[#6b3410] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                              >
                                {updatingId === item.id ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                                <span>Confirm Order</span>
                              </button>
                            )}
                            {item.status === "CONFIRMED" && (
                              <button
                                onClick={() => handleUpdateStatus(item.id, "SHIPPED")}
                                disabled={updatingId === item.id}
                                className="flex items-center space-x-2 px-4 py-2 bg-[#d4b996] text-[#3e2f25] rounded-xl font-semibold hover:bg-[#c4a57e] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                              >
                                {updatingId === item.id ? (
                                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                                <span>Mark as Shipped</span>
                              </button>
                            )}
                            {item.status === "SHIPPED" && (
                              <button
                                onClick={() => handleUpdateStatus(item.id, "DELIVERED")}
                                disabled={updatingId === item.id}
                                className="flex items-center space-x-2 px-4 py-2 bg-[#3e2f25] text-white rounded-xl font-semibold hover:bg-[#5a4436] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                              >
                                {updatingId === item.id ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                )}
                                <span>Mark as Delivered</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Total */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-[#e6d9c6]">
                    <div className="text-[#5a4436] text-sm mb-2 sm:mb-0">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} items in this order
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#8b4513]">
                        KWD {order.total.toFixed(2)}
                      </p>
                      <p className="text-sm text-[#5a4436] mt-1">Your Earnings</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Orders Summary */}
          {orders.length > 0 && (
            <div className="mt-12 text-center">
              <div className="bg-white rounded-2xl shadow-lg p-6 inline-block">
                <p className="text-lg text-[#3e2f25]">
                  You have <span className="font-bold text-[#8b4513]">{orders.length}</span> 
                  {orders.length === 1 ? ' customer order' : ' customer orders'} to manage
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  </>
);

}

// --- Server-side fetch with categories and user ---
export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  // Only fetch order items if logged in
  const orderItems = session
    ? await prisma.orderItem.findMany({
        where: { sellerId: session.user.id },
        include: {
          order: { include: { user: true } },
          product: true,
        },
        orderBy: { order: { createdAt: "desc" } },
      })
    : [];

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
      user: {
        id: session?.user?.id ?? "Guest",
        name: session?.user?.name ?? "Guest",
        role: session?.user?.role ?? "Guest",
      },
    },
  };
};

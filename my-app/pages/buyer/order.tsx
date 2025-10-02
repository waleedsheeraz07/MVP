// pages/buyer/orders.tsx:
import Head from 'next/head'
import { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import { prisma } from "../../lib/prisma";
import Layout from "../../components/header";
import Link from "next/link";

interface ProductItem {
  id: string;
  title: string;
  price: number;
  images: string[];
}

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  color?: string | null;
  size?: string | null;
  status: string;
  product: ProductItem;
}

interface Order {
  id: string;
  createdAt: string;
  status: string;
  payment: string;
  address: string;
  items: OrderItem[];
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

interface OrdersPageProps {
  orders: Order[];
  categories: Category[];
  user: User;
}

// ✅ Status badge component with soft colors
function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    PENDING: "bg-gray-200 text-gray-800",
    CONFIRMED: "bg-blue-200 text-blue-800",
    SHIPPED: "bg-yellow-200 text-yellow-800",
    DELIVERED: "bg-green-200 text-green-800",
    CANCELLED: "bg-red-200 text-red-800",
  };
  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${colors[status] || "bg-gray-200 text-gray-800"}`}>
      {status}
    </span>
  );
}

export default function OrdersPage({ orders, categories, user }: OrdersPageProps) {

return (
  <>
    <Head>
      <title>Your Vintage Orders | Vintage Marketplace</title>
      <meta name="description" content="Track and manage your orders for authentic vintage treasures." />
    </Head>
    
    <Layout categories={categories} user={user}>
      <div className="min-h-screen bg-[#fefaf5] py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#3e2f25] mb-4">
              Your Vintage Orders
            </h1>
            <p className="text-lg text-[#5a4436] max-w-2xl mx-auto">
              Track your collection of timeless treasures and their journey to you
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
              <p className="text-[#5a4436] mb-6">Start your collection of vintage treasures</p>
              <Link href="/buyer/products">
                <a className="inline-flex items-center space-x-2 px-8 py-3 bg-[#8b4513] text-white rounded-xl font-semibold hover:bg-[#6b3410] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl">
                  <span>Explore Vintage Treasures</span>
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
                    
                    <div className="mt-3 sm:mt-0">
                      <StatusBadge status={order.status} />
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl p-4 mb-6">
                    <div className="flex items-start space-x-2">
                      <svg className="w-5 h-5 text-[#8b4513] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <div>
                        <p className="font-semibold text-[#3e2f25] text-sm mb-1">Shipping Address</p>
                        <p className="text-[#5a4436] text-sm">{order.address}</p>
                      </div>
                    </div>
                  </div>

                  {/* Order Items - Updated to match seller page style */}
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

                        {/* Price */}
                        <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                          <div className="text-right sm:text-left">
                            <p className="text-lg font-bold text-[#8b4513]">
                              KWD {(item.price * item.quantity).toFixed(2)}
                            </p>
                            <p className="text-sm text-[#5a4436] mt-1">
                              KWD {item.price.toFixed(2)} each
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Order Total */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between pt-4 border-t border-[#e6d9c6]">
                    <div className="text-[#5a4436] text-sm mb-2 sm:mb-0">
                      {order.items.reduce((sum, item) => sum + item.quantity, 0)} items
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#8b4513]">
                        KWD {order.total.toFixed(2)}
                      </p>
                      <p className="text-sm text-[#5a4436] mt-1">Total Amount</p>
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
                  {orders.length === 1 ? ' vintage order' : ' vintage orders'} in total
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

// ✅ Server-side fetch with categories and user
export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  // Only fetch orders if logged in
  const ordersData = session
    ? await prisma.order.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: "desc" },
        include: { items: { include: { product: true } } },
      })
    : [];

  const formattedOrders: Order[] = ordersData.map((o) => ({
    id: o.id,
    createdAt: o.createdAt.toISOString(),
    status: o.status,
    payment: o.payment,
    address: o.address || "",
    total: o.total,
    items: o.items.map((i) => ({
      id: i.id,
      quantity: i.quantity,
      price: i.price,
      color: i.color,
      size: i.size,
      status: i.status,
      product: {
        id: i.product.id,
        title: i.product.title,
        price: i.product.price,
        images: i.product.images,
      },
    })),
  }));

  const categories = await prisma.category.findMany({
    select: { id: true, title: true, order: true, parentId: true },
    orderBy: { order: "asc" },
  });

  return {
    props: {
      orders: formattedOrders,
      categories,
      user: { 
        id: session?.user?.id ?? "Guest",
        name: session?.user?.name ?? "Guest",
        role: session?.user?.role ?? "Guest",
      },
    },
  };
};

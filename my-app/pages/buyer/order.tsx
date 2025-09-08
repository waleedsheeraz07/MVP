// pages/buyer/orders.tsx:
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
    <Layout categories={categories} user={user}>
      <div className="min-h-screen bg-[#fdf8f3] p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-[#3e2f25] text-center sm:text-left">
            My Orders
          </h1>

          {orders.length === 0 ? (
            <p className="text-center text-gray-600">
              You have not placed any orders yet.{" "}
              <Link href="/buyer/products" className="text-[#5a4436] font-semibold hover:underline">
                Browse products
              </Link>
            </p>
          ) : (
            <div className="space-y-6">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="bg-[#fffdfb] border rounded-2xl shadow-sm p-4 space-y-4 hover:shadow-md transition-all"
                >
                  <div className="flex justify-between items-center">
                    <h2 className="font-semibold text-[#3e2f25]">
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </h2>
                    <span className="text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="text-sm space-y-1">
                    <p>
                      <strong>Order Status:</strong>{" "}
                      <StatusBadge status={order.status} />
                    </p>
                    <p>
                      <strong>Payment:</strong> {order.payment}
                    </p>
                    <p>
                      <strong>Shipping Address:</strong> {order.address}
                    </p>
                  </div>

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
                        <p className="font-semibold text-[#3e2f25]">
                          KWD {(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end font-bold text-[#3e2f25] text-lg">
                    Total: KWD {order.total.toFixed(2)}
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

// ✅ Server-side fetch with categories and user
export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session?.user?.id) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  const ordersData = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { items: { include: { product: true } } },
  });

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
      user: { id: session.user.id, name: session.user.name || "Guest", role: session.user.role },
    },
  };
};

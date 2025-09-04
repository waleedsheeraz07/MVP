// pages/orders.tsx
import { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";
import { prisma } from "../lib/prisma";
import Layout from "../components/header";

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
}

interface OrdersPageProps {
  orders: Order[];
  categories: Category[];
  user: User;
}

// ✅ Status badge component
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
      <div className="max-w-4xl mx-auto p-4 min-h-screen">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-[#3e2f25] text-center sm:text-left">
          My Orders
        </h1>

        {orders.length === 0 ? (
          <p className="text-center text-gray-700">
            You have not placed any orders yet.{" "}
            <a href="/products" className="text-[#5a4436] hover:underline font-semibold">
              Browse products
            </a>
          </p>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div key={order.id} className="border rounded p-4 shadow-sm bg-white space-y-4 hover:shadow-md transition">
                <div className="flex justify-between items-center">
                  <h2 className="font-semibold">Order #{order.id.slice(0, 8).toUpperCase()}</h2>
                  <span className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString()}</span>
                </div>

                <div className="text-sm space-y-1">
                  <p>
                    <strong>Order Status:</strong> <StatusBadge status={order.status} />
                  </p>
                  <p>
                    <strong>Payment:</strong> {order.payment}
                  </p>
                  <p>
                    <strong>Shipping Address:</strong> {order.address}
                  </p>
                </div>

                <div className="space-y-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center justify-between border p-2 rounded hover:bg-gray-50 transition">
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
                            Size: {item.size || "N/A"} | Color: {item.color || "N/A"}
                          </p>
                          <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                          <div className="mt-1">
                            <StatusBadge status={item.status} />
                          </div>
                        </div>
                      </div>
                      <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end font-bold text-[#3e2f25]">Total: ${order.total.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

// ✅ Server-side fetching
export const getServerSideProps = async (context: GetServerSidePropsContext) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session?.user?.id) {
    return { redirect: { destination: "/auth/signin", permanent: false } };
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
      user: { id: session.user.id, name: session.user.name || "Guest" },
    },
  };
};
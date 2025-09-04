import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";
import { prisma } from "../lib/prisma";

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
  status: string; // ✅ added
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

interface OrdersPageProps {
  orders: Order[];
}

export default function OrdersPage({ orders }: OrdersPageProps) {
  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto p-4 min-h-screen">
        <h1 className="text-2xl font-bold mb-4">My Orders</h1>
        <p>You have not placed any orders yet.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">My Orders</h1>

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
                <strong>Order Status:</strong> {order.status}
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
                      <p className="text-sm text-blue-600 font-medium">
                        Item Status: {item.status} {/* ✅ added */}
                      </p>
                    </div>
                  </div>
                  <p className="font-semibold">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-end font-bold">
              Total: ${order.total.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ✅ Server-side fetching
export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session?.user?.id) {
    return {
      redirect: { destination: "/auth/signin", permanent: false },
    };
  }

  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: {
          product: true,
        },
      },
    },
  });

  const formattedOrders: Order[] = orders.map((o) => ({
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
      status: i.status, // ✅ added
      product: {
        id: i.product.id,
        title: i.product.title,
        price: i.product.price,
        images: i.product.images,
      },
    })),
  }));

  return { props: { orders: formattedOrders } };
};
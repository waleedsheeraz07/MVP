import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import { prisma } from "../../lib/prisma";

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
  product: ProductItem;
}

interface SellerOrder {
  id: string;
  createdAt: string;
  status: string;
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
                <strong>Status:</strong> {order.status}
              </p>
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
                    </div>
                  </div>
                  <p className="font-semibold">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>

            <div className="flex justify-end font-bold">
              Seller Total: ${order.total.toFixed(2)}
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

  // Fetch orders where this seller has items
  const orderItems = await prisma.orderItem.findMany({
    where: { sellerId: session.user.id },
    include: {
      order: {
        include: { user: true },
      },
      product: true,
    },
    orderBy: { createdAt: "desc" },
  });

  // Group by order
  const orderMap: Record<string, SellerOrder> = {};
  for (const item of orderItems) {
    if (!orderMap[item.orderId]) {
      orderMap[item.orderId] = {
        id: item.orderId,
        createdAt: item.order.createdAt.toISOString(),
        status: item.order.status,
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
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";
import { prisma } from "../lib/prisma";
import { useState } from "react";
import { useRouter } from "next/router";
import Layout from "../components/header";
  
interface ProductItem {
  id: string;
  title: string;
  price: number;
  images: string[];
}

interface CartItem {
  id: string;
  quantity: number;
  color?: string | null;
  size?: string | null;
  product: ProductItem;
}

interface Category {
  id: string;
  title: string;
  order: number;
  parentId?: string | null;
}

interface UserInfo {
  id: string;
  name?: string | null;
  firstName: string;
  lastName?: string;
  phoneNumber?: string;
  address1?: string;
  address2?: string;
  state?: string;
  country?: string;
  postalCode?: string;
}

interface CheckoutProps {
  user: UserInfo;
  cartItems: CartItem[];
  categories: Category[];
}

export default function CheckoutPage({ user, cartItems, categories }: CheckoutProps) {
 const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  const [form, setForm] = useState<UserInfo>({
    id: user.id,
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    phoneNumber: user.phoneNumber || "", // ✅ correct field
    address1: user.address1 || "",
    address2: user.address2 || "",
    state: user.state || "",
    country: user.country || "",
    postalCode: user.postalCode || "",
  });

  const [paymentMethod, setPaymentMethod] = useState<"COD" | "CARD">("COD");

  const combinedAddress = `${form.address1}${form.address2 ? ", " + form.address2 : ""}, ${form.state}, ${form.country}, ${form.postalCode}`;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleNext = () => {
    const requiredFields: (keyof UserInfo)[] = [
      "firstName",
      "phoneNumber",
      "address1",
      "state",
      "country",
      "postalCode",
    ];
    for (const field of requiredFields) {
      if (!form[field]) {
        alert("Please fill in all required fields");
        return;
      }
    }
    setStep(2);
  };

  const handlePlaceOrder = async () => {
    try {
      const res = await fetch("/api/checkout/place-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: combinedAddress,
          phoneNumber: form.phoneNumber,
          name: `${form.firstName} ${form.lastName || ""}`,
          payment: paymentMethod,
        }),
      });
      if (!res.ok) throw new Error("Failed to place order");
      const data = await res.json();
      router.push(`/order-success/${data.orderId}`);
    } catch (err: unknown) {
      alert((err as Error).message || "Something went wrong");
    }
  };

  return (
 <Layout categories={categories} user={user}>
     
<div className="max-w-4xl mx-auto p-4 min-h-screen bg-[#fdf8f3]">
  {/* Step 1: Shipping Address */}
  {step === 1 && (
    <div className="space-y-6 bg-[#fffdfb] p-6 rounded-2xl shadow-sm hover:shadow-md transition">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#3e2f25]">Shipping Address</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          name="firstName"
          placeholder="First Name"
          value={form.firstName}
          onChange={handleInputChange}
          className="border p-3 rounded-xl focus:ring-2 focus:ring-[#5a4436] outline-none bg-white text-[#3e2f25]"
        />
        <input
          name="lastName"
          placeholder="Last Name"
          value={form.lastName}
          onChange={handleInputChange}
          className="border p-3 rounded-xl focus:ring-2 focus:ring-[#5a4436] outline-none bg-white text-[#3e2f25]"
        />
        <input
          name="phoneNumber"
          placeholder="Phone Number"
          value={form.phoneNumber || ""}
          onChange={handleInputChange}
          className="border p-3 rounded-xl sm:col-span-2 focus:ring-2 focus:ring-[#5a4436] outline-none bg-white text-[#3e2f25]"
        />
        <input
          name="address1"
          placeholder="Address Line 1"
          value={form.address1}
          onChange={handleInputChange}
          className="border p-3 rounded-xl sm:col-span-2 focus:ring-2 focus:ring-[#5a4436] outline-none bg-white text-[#3e2f25]"
        />
        <input
          name="address2"
          placeholder="Address Line 2 (Optional)"
          value={form.address2 || ""}
          onChange={handleInputChange}
          className="border p-3 rounded-xl sm:col-span-2 focus:ring-2 focus:ring-[#5a4436] outline-none bg-white text-[#3e2f25]"
        />
        <input
          name="state"
          placeholder="State"
          value={form.state || ""}
          onChange={handleInputChange}
          className="border p-3 rounded-xl focus:ring-2 focus:ring-[#5a4436] outline-none bg-white text-[#3e2f25]"
        />
        <input
          name="country"
          placeholder="Country"
          value={form.country || ""}
          onChange={handleInputChange}
          className="border p-3 rounded-xl focus:ring-2 focus:ring-[#5a4436] outline-none bg-white text-[#3e2f25]"
        />
        <input
          name="postalCode"
          placeholder="Postal Code"
          value={form.postalCode || ""}
          onChange={handleInputChange}
          className="border p-3 rounded-xl focus:ring-2 focus:ring-[#5a4436] outline-none bg-white text-[#3e2f25]"
        />
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={() => router.push("/cart")}
          className="px-5 py-2 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 hover:text-gray-900 transition-all duration-150 active:scale-95"
        >
          Back
        </button>

        <button
          onClick={handleNext}
          className="px-5 py-2 bg-[#5a4436] text-white rounded-xl hover:bg-[#3e2f25] transition-all duration-150 active:scale-95"
        >
          Next
        </button>
      </div>
    </div>
  )}

  {/* Step 2: Review & Payment */}
  {step === 2 && (
    <div className="space-y-6 bg-[#fffdfb] p-6 rounded-2xl shadow-sm hover:shadow-md transition">
      <h1 className="text-2xl sm:text-3xl font-bold text-[#3e2f25]">Review & Payment</h1>

      {/* Shipping Summary */}
      <div className="border rounded-xl p-4 bg-white text-[#3e2f25] space-y-1">
        <p><strong>Name:</strong> {form.firstName} {form.lastName}</p>
        <p><strong>Phone:</strong> {form.phoneNumber}</p>
        <p><strong>Address:</strong> {combinedAddress}</p>
      </div>

      {/* Cart Items */}
      <div className="space-y-4">
        {cartItems.map((item) => (
          <div
            key={item.id}
            className="flex flex-col sm:flex-row items-center sm:items-start border rounded-xl p-3 bg-white gap-4 hover:shadow-sm transition"
          >
            <div className="w-20 h-20 flex-shrink-0">
              <img
                src={item.product.images[0]}
                alt={item.product.title}
                className="w-full h-full object-cover rounded-lg"
              />
            </div>

            <div className="flex-1">
              <h2 className="font-semibold text-[#3e2f25]">{item.product.title}</h2>
              <p className="text-sm text-gray-600 mt-1">
                Size: {item.size || "N/A"} | Color: {item.color || "N/A"}
              </p>
              <p className="text-sm text-gray-600 mt-1">Qty: {item.quantity}</p>
            </div>

            <div className="text-right font-semibold text-[#3e2f25] mt-2 sm:mt-0">
              ${(item.product.price * item.quantity).toFixed(2)}
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div className="border-t pt-4 text-right space-y-1">
        <p><strong>Total Products:</strong> {cartItems.reduce((sum, item) => sum + item.quantity, 0)}</p>
        <p className="text-lg font-bold"><strong>Total Amount:</strong> ${cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0).toFixed(2)}</p>
      </div>

      {/* Payment Options */}
      <div className="space-y-3 mt-4 bg-white p-4 rounded-xl border">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="payment"
            value="COD"
            checked={paymentMethod === "COD"}
            onChange={() => setPaymentMethod("COD")}
          />
          Cash on Delivery
        </label>
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name="payment"
            value="CARD"
            checked={paymentMethod === "CARD"}
            onChange={() => setPaymentMethod("CARD")}
          />
          Card (Mock)
        </label>
      </div>

      {/* Navigation Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 mt-6">
        <button
          onClick={() => setStep(1)}
          className="flex-1 px-5 py-2 border rounded-xl text-gray-800 hover:bg-gray-200 hover:text-gray-900 transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-gray-400"
        >
          Back
        </button>

        <button
          onClick={handlePlaceOrder}
          className="flex-1 px-5 py-2 bg-[#5a4436] text-white rounded-xl hover:bg-[#3e2f25] transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-[#5a4436]"
        >
          Place Order
        </button>
      </div>
    </div>
  )}
</div>
</Layout>
  );
}

// ✅ Server-side props
export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session?.user?.id) {
    return {
      redirect: { destination: "/auth/signin", permanent: false },
    };
  }

  // Fetch user info
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      firstName: true,
      lastName: true,
      phoneNumber: true,
      address1: true,
      address2: true,
      state: true,
      country: true,
      postalCode: true,
    },
  });

  // Fetch cart items
  const userItems = await prisma.userItem.findMany({
    where: { userId: session.user.id, status: "cart" },
    include: { product: true },
  });

  const cartItems: CartItem[] = userItems.map(i => ({
    id: i.id,
    quantity: i.quantity,
    color: i.color,
    size: i.size,
    product: {
      id: i.product.id,
      title: i.product.title,
      price: i.product.price,
      images: i.product.images,
    },
  }));

  // Fetch categories
  const categories = await prisma.category.findMany({
    select: { id: true, title: true, order: true, parentId: true },
    orderBy: { order: "asc" },
  });

  return {
    props: {
      user: {
        id: session.user.id,
        name: session.user.name || "Guest",
        ...(dbUser || {}),
      },
      cartItems,
      categories,
    },
  };
};
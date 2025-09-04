import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";
import { prisma } from "../lib/prisma";
import { useState } from "react";
import { useRouter } from "next/router";


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
    <div className="max-w-3xl mx-auto p-4 min-h-screen">
      {step === 1 && (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Shipping Address</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              name="firstName"
              placeholder="First Name"
              value={form.firstName}
              onChange={handleInputChange}
              className="border p-2 rounded"
            />
            <input
              name="lastName"
              placeholder="Last Name"
              value={form.lastName}
              onChange={handleInputChange}
              className="border p-2 rounded"
            />
            <input
              name="phoneNumber"
              placeholder="Phone"
              value={form.phoneNumber || ""}
              onChange={handleInputChange}
              className="border p-2 rounded sm:col-span-2"
            />
            <input
              name="address1"
              placeholder="Address Line 1"
              value={form.address1}
              onChange={handleInputChange}
              className="border p-2 rounded sm:col-span-2"
            />
            <input
              name="address2"
              placeholder="Address Line 2"
              value={form.address2 || ""}
              onChange={handleInputChange}
              className="border p-2 rounded sm:col-span-2"
            />
            <input
              name="state"
              placeholder="State"
              value={form.state || ""}
              onChange={handleInputChange}
              className="border p-2 rounded"
            />
            <input
              name="country"
              placeholder="Country"
              value={form.country || ""}
              onChange={handleInputChange}
              className="border p-2 rounded"
            />
            <input
              name="postalCode"
              placeholder="Postal Code"
              value={form.postalCode || ""}
              onChange={handleInputChange}
              className="border p-2 rounded"
            />
          </div>
          <button
            onClick={handleNext}
            className="mt-4 px-4 py-2 bg-[#5a4436] text-white rounded hover:bg-[#3e2f25] transition"
          >
            Next
          </button>
        </div>
      )}

 {step === 2 && (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold">Review & Payment</h1>

    <div className="border p-2 rounded space-y-1">
      <p>
        <strong>Name:</strong> {form.firstName} {form.lastName}
      </p>
      <p>
        <strong>Phone:</strong> {form.phoneNumber}
      </p>
      <p>
        <strong>Address:</strong> {combinedAddress}
      </p>
    </div>

    {/* ✅ Cart Items */}
    <div className="space-y-4">
      {cartItems.map((item) => (
        <div
          key={item.id}
          className="flex items-center border rounded p-2 gap-4"
        >
          <div className="w-20 h-20 flex-shrink-0">
            <img
              src={item.product.images[0]}
              alt={item.product.title}
              className="w-full h-full object-cover rounded"
            />
          </div>

          <div className="flex-1">
            <h2 className="font-semibold">{item.product.title}</h2>
            <p className="text-sm text-gray-600">
              Size: {item.size || "N/A"} | Color: {item.color || "N/A"}
            </p>
            <p className="text-sm">Qty: {item.quantity}</p>
          </div>

          <div className="text-right font-semibold">
            ${(item.product.price * item.quantity).toFixed(2)}
          </div>
        </div>
      ))}
    </div>

    {/* ✅ Summary */}
    <div className="border-t pt-3 text-right">
      <p>
        <strong>Total Products:</strong>{" "}
        {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
      </p>
      <p className="text-lg font-bold">
        <strong>Total Amount:</strong> $
        {cartItems
          .reduce((sum, item) => sum + item.product.price * item.quantity, 0)
          .toFixed(2)}
      </p>
    </div>

    {/* ✅ Payment Options */}
    <div className="space-y-2 mt-2">
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

    {/* ✅ Navigation Buttons */}
    <div className="flex gap-2 mt-4">
      <button
        onClick={() => setStep(1)}
        className="flex-1 px-4 py-2 border rounded hover:bg-gray-100 transition"
      >
        Back
      </button>
      <button
        onClick={handlePlaceOrder}
        className="flex-1 px-4 py-2 bg-[#5a4436] text-white rounded hover:bg-[#3e2f25] transition"
      >
        Place Order
      </button>
    </div>
  </div>
)}
    </div>
  );
}

// ✅ Server-side props
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";
import { prisma } from "../lib/prisma";
import { useState } from "react";
import { useRouter } from "next/router";

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

interface UserInfo {
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
}

export default function CheckoutPage({ user, cartItems }: CheckoutProps) {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);

  const [form, setForm] = useState<UserInfo>({
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
    <div className="max-w-3xl mx-auto p-4 min-h-screen">
      {step === 1 && (
        <div className="space-y-4">
          <h1 className="text-2xl font-bold">Shipping Address</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <input
              name="firstName"
              placeholder="First Name"
              value={form.firstName}
              onChange={handleInputChange}
              className="border p-2 rounded"
            />
            <input
              name="lastName"
              placeholder="Last Name"
              value={form.lastName}
              onChange={handleInputChange}
              className="border p-2 rounded"
            />
            <input
              name="phoneNumber"
              placeholder="Phone"
              value={form.phoneNumber || ""}
              onChange={handleInputChange}
              className="border p-2 rounded sm:col-span-2"
            />
            <input
              name="address1"
              placeholder="Address Line 1"
              value={form.address1}
              onChange={handleInputChange}
              className="border p-2 rounded sm:col-span-2"
            />
            <input
              name="address2"
              placeholder="Address Line 2"
              value={form.address2 || ""}
              onChange={handleInputChange}
              className="border p-2 rounded sm:col-span-2"
            />
            <input
              name="state"
              placeholder="State"
              value={form.state || ""}
              onChange={handleInputChange}
              className="border p-2 rounded"
            />
            <input
              name="country"
              placeholder="Country"
              value={form.country || ""}
              onChange={handleInputChange}
              className="border p-2 rounded"
            />
            <input
              name="postalCode"
              placeholder="Postal Code"
              value={form.postalCode || ""}
              onChange={handleInputChange}
              className="border p-2 rounded"
            />
          </div>
          <button
            onClick={handleNext}
            className="mt-4 px-4 py-2 bg-[#5a4436] text-white rounded hover:bg-[#3e2f25] transition"
          >
            Next
          </button>
        </div>
      )}

 {step === 2 && (
  <div className="space-y-4">
    <h1 className="text-2xl font-bold">Review & Payment</h1>

    <div className="border p-2 rounded space-y-1">
      <p>
        <strong>Name:</strong> {form.firstName} {form.lastName}
      </p>
      <p>
        <strong>Phone:</strong> {form.phoneNumber}
      </p>
      <p>
        <strong>Address:</strong> {combinedAddress}
      </p>
    </div>

    {/* ✅ Cart Items */}
    <div className="space-y-4">
      {cartItems.map((item) => (
        <div
          key={item.id}
          className="flex items-center border rounded p-2 gap-4"
        >
          <div className="w-20 h-20 flex-shrink-0">
            <img
              src={item.product.images[0]}
              alt={item.product.title}
              className="w-full h-full object-cover rounded"
            />
          </div>

          <div className="flex-1">
            <h2 className="font-semibold">{item.product.title}</h2>
            <p className="text-sm text-gray-600">
              Size: {item.size || "N/A"} | Color: {item.color || "N/A"}
            </p>
            <p className="text-sm">Qty: {item.quantity}</p>
          </div>

          <div className="text-right font-semibold">
            ${(item.product.price * item.quantity).toFixed(2)}
          </div>
        </div>
      ))}
    </div>

    {/* ✅ Summary */}
    <div className="border-t pt-3 text-right">
      <p>
        <strong>Total Products:</strong>{" "}
        {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
      </p>
      <p className="text-lg font-bold">
        <strong>Total Amount:</strong> $
        {cartItems
          .reduce((sum, item) => sum + item.product.price * item.quantity, 0)
          .toFixed(2)}
      </p>
    </div>

    {/* ✅ Payment Options */}
    <div className="space-y-2 mt-2">
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

    {/* ✅ Navigation Buttons */}
    <div className="flex gap-2 mt-4">
      <button
        onClick={() => setStep(1)}
        className="flex-1 px-4 py-2 border rounded hover:bg-gray-100 transition"
      >
        Back
      </button>
      <button
        onClick={handlePlaceOrder}
        className="flex-1 px-4 py-2 bg-[#5a4436] text-white rounded hover:bg-[#3e2f25] transition"
      >
        Place Order
      </button>
    </div>
  </div>
)}
    </div>
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

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      firstName: true,
      lastName: true,
      phoneNumber: true, // ✅ correct field
      address1: true,
      address2: true,
      state: true,
      country: true,
      postalCode: true,
    },
  });

  const userItems = await prisma.userItem.findMany({
    where: { userId: session.user.id, status: "cart" },
    include: { product: true },
  });

  const cartItems: CartItem[] = userItems.map((i) => ({
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

  return {
    props: {
      user: user || {},
      cartItems,
    },
  };
};
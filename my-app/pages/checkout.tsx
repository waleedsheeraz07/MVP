'use client';

import { useState, useEffect } from "react";
import { useRouter } from "next/router";

interface CheckoutProps {
  user: {
    firstName: string;
    lastName?: string;
    phone?: string;
    address1?: string;
    address2?: string;
    state?: string;
    country?: string;
    postalCode?: string;
  };
  cartItems: any[]; // fetched server-side or via API
}

export default function CheckoutPage({ user, cartItems }: CheckoutProps) {
  const router = useRouter();
  
  // Step state: 1 = address, 2 = review + payment
  const [step, setStep] = useState(1);

  const [form, setForm] = useState({
    firstName: user.firstName || "",
    lastName: user.lastName || "",
    phone: user.phone || "",
    address1: user.address1 || "",
    address2: user.address2 || "",
    state: user.state || "",
    country: user.country || "",
    postalCode: user.postalCode || "",
  });

  const [paymentMethod, setPaymentMethod] = useState("COD"); // default

  // Combine address fields into one string for Order
  const combinedAddress = `${form.address1}${form.address2 ? ", " + form.address2 : ""}, ${form.state}, ${form.country}, ${form.postalCode}`;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleNext = () => {
    // Validate required fields
    if (!form.firstName || !form.phone || !form.address1 || !form.state || !form.country || !form.postalCode) {
      alert("Please fill in all required fields");
      return;
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
          phone: form.phone,
          name: `${form.firstName} ${form.lastName || ""}`,
          payment: paymentMethod,
        }),
      });
      if (!res.ok) throw new Error("Failed to place order");
      const data = await res.json();
      router.push(`/order-success/${data.orderId}`);
    } catch (err: any) {
      alert(err.message || "Something went wrong");
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
              name="phone"
              placeholder="Phone"
              value={form.phone}
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
              value={form.address2}
              onChange={handleInputChange}
              className="border p-2 rounded sm:col-span-2"
            />
            <input
              name="state"
              placeholder="State"
              value={form.state}
              onChange={handleInputChange}
              className="border p-2 rounded"
            />
            <input
              name="country"
              placeholder="Country"
              value={form.country}
              onChange={handleInputChange}
              className="border p-2 rounded"
            />
            <input
              name="postalCode"
              placeholder="Postal Code"
              value={form.postalCode}
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

          {/* Shipping info */}
          <div className="border p-2 rounded space-y-1">
            <p><strong>Name:</strong> {form.firstName} {form.lastName}</p>
            <p><strong>Phone:</strong> {form.phone}</p>
            <p><strong>Address:</strong> {combinedAddress}</p>
          </div>

          {/* Cart items */}
          <div className="space-y-2">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center border p-2 rounded">
                <p>{item.product.title} x {item.quantity}</p>
                <p>${(item.product.price * item.quantity).toFixed(2)}</p>
              </div>
            ))}
          </div>

          {/* Payment method */}
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
            {/* future: CARD option */}
          </div>

          <button
            onClick={handlePlaceOrder}
            className="mt-4 px-4 py-2 bg-[#5a4436] text-white rounded hover:bg-[#3e2f25] transition w-full"
          >
            Place Order
          </button>
        </div>
      )}
    </div>
  );
}
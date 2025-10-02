// pages/buyer/checkout.tsx:
import Head from 'next/head'
import { GetServerSideProps } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import { prisma } from "../../lib/prisma";
import { useState } from "react";
import { useRouter } from "next/router";
import Layout from "../../components/header";
  
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
  role: string;
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
    role: user.role || "",
    phoneNumber: user.phoneNumber || "", // ✅ correct field
    address1: user.address1 || "",
    address2: user.address2 || "",
    state: user.state || "",
    country: user.country || "",
    postalCode: user.postalCode || "",
  });

  const [paymentMethod, setPaymentMethod] = useState<string>("COD");

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
      router.push(`/buyer/order`);
    } catch (err: unknown) {
      alert((err as Error).message || "Something went wrong");
    }
  };

return (
  <>
    <Head>
      <title>Secure Checkout | Vintage Marketplace</title>
      <meta name="description" content="Complete your purchase of authentic vintage treasures with secure checkout." />
    </Head>
    
    <Layout categories={categories} user={user}>
      <div className="min-h-screen bg-[#fefaf5] py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#3e2f25] mb-4">
              Secure Checkout
            </h1>
            <p className="text-lg text-[#5a4436] max-w-2xl mx-auto">
              Complete your purchase of timeless vintage treasures
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4 bg-white rounded-2xl shadow-lg p-4">
              <div className={`flex items-center space-x-2 ${step >= 1 ? 'text-[#8b4513]' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  step >= 1 ? 'bg-[#8b4513] border-[#8b4513] text-white' : 'border-gray-300'
                }`}>
                  1
                </div>
                <span className="font-medium">Shipping</span>
              </div>
              
              <div className="w-8 h-0.5 bg-gray-300"></div>
              
              <div className={`flex items-center space-x-2 ${step >= 2 ? 'text-[#8b4513]' : 'text-gray-400'}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                  step >= 2 ? 'bg-[#8b4513] border-[#8b4513] text-white' : 'border-gray-300'
                }`}>
                  2
                </div>
                <span className="font-medium">Payment</span>
              </div>
            </div>
          </div>

          {/* Step 1: Shipping Address */}
          {step === 1 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-[#3e2f25] mb-2">Shipping Address</h2>
                <p className="text-[#5a4436]">Where should we deliver your vintage treasures?</p>
              </div>

              <form className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-[#3e2f25] mb-2">First Name *</label>
                    <input
                      name="firstName"
                      placeholder="Enter your first name"
                      value={form.firstName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-semibold text-[#3e2f25] mb-2">Last Name *</label>
                    <input
                      name="lastName"
                      placeholder="Enter your last name"
                      value={form.lastName}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-[#3e2f25] mb-2">Phone Number *</label>
                    <input
                      name="phoneNumber"
                      placeholder="Enter your phone number"
                      value={form.phoneNumber || ""}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-[#3e2f25] mb-2">Address Line 1 *</label>
                    <input
                      name="address1"
                      placeholder="Street address, P.O. box, company name"
                      value={form.address1}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-sm font-semibold text-[#3e2f25] mb-2">Address Line 2</label>
                    <input
                      name="address2"
                      placeholder="Apartment, suite, unit, building, floor, etc."
                      value={form.address2 || ""}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#3e2f25] mb-2">State *</label>
                    <input
                      name="state"
                      placeholder="Enter your state"
                      value={form.state || ""}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#3e2f25] mb-2">Country *</label>
                    <input
                      name="country"
                      placeholder="Enter your country"
                      value={form.country || ""}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-[#3e2f25] mb-2">Postal Code *</label>
                    <input
                      name="postalCode"
                      placeholder="Enter postal code"
                      value={form.postalCode || ""}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 pt-6">
                  <button
                    type="button"
                    onClick={() => router.push("/buyer/cart")}
                    className="flex-1 px-6 py-3 bg-transparent border-2 border-[#8b4513] text-[#8b4513] rounded-xl font-semibold hover:bg-[#8b4513] hover:text-white transform hover:scale-105 transition-all duration-300"
                  >
                    Back to Cart
                  </button>

                  <button
                    type="button"
                    onClick={handleNext}
                    className="flex-1 px-6 py-3 bg-[#8b4513] text-white rounded-xl font-semibold hover:bg-[#6b3410] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Continue to Payment
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Step 2: Review & Payment */}
          {step === 2 && (
            <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-[#3e2f25] mb-2">Review & Payment</h2>
                <p className="text-[#5a4436]">Review your order and choose payment method</p>
              </div>

              {/* Shipping Summary */}
              <div className="bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl p-6 mb-6">
                <h3 className="text-lg font-semibold text-[#3e2f25] mb-4">Shipping Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[#5a4436]">
                  <div>
                    <p className="font-medium">Name</p>
                    <p>{form.firstName} {form.lastName}</p>
                  </div>
                  <div>
                    <p className="font-medium">Phone</p>
                    <p>{form.phoneNumber}</p>
                  </div>
                  <div className="sm:col-span-2">
                    <p className="font-medium">Address</p>
                    <p>{combinedAddress}</p>
                  </div>
                </div>
              </div>

     {/* Order Items - Updated to match orders page style */}
<div className="mb-6">
  <h3 className="text-lg font-semibold text-[#3e2f25] mb-4">Order Summary</h3>
  <div className="space-y-4">
    {cartItems.map((item) => (
      <div
        key={item.id}
        className="flex flex-col sm:flex-row items-start sm:items-center bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl p-4 hover:shadow-md transition-all duration-300 group/item"
      >
        {/* Product Image & Details */}
        <div className="flex-1 flex items-start sm:items-center gap-4 mb-4 sm:mb-0">
          {/* Product Image */}
          <div 
            onClick={() => router.push(`/buyer/products/${item.product.id}`)}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden cursor-pointer transform transition-transform duration-300 hover:scale-105 flex-shrink-0"
          >
            <img
              src={item.product.images[0]}
              alt={item.product.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Product Details */}
          <div className="flex-1 min-w-0">
            <h4 
              onClick={() => router.push(`/buyer/products/${item.product.id}`)}
              className="font-semibold text-[#3e2f25] truncate hover:text-[#8b4513] transition-colors duration-300 cursor-pointer"
            >
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
          </div>
        </div>

        {/* Price */}
        <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
          <div className="text-right sm:text-left">
            <p className="text-lg font-bold text-[#8b4513]">
              KWD {(item.product.price * item.quantity).toFixed(2)}
            </p>
            <p className="text-sm text-[#5a4436] mt-1">
              KWD {item.product.price.toFixed(2)} each
            </p>
          </div>
        </div>
      </div>
    ))}
  </div>
</div>

              {/* Order Total */}
              <div className="bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl p-6 mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[#5a4436]">Items ({cartItems.reduce((sum, item) => sum + item.quantity, 0)})</span>
                  <span className="text-[#3e2f25]">KWD {cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[#5a4436]">Shipping</span>
                  <span className="text-[#3e2f25]">KWD 2.000</span>
                </div>
                <div className="flex justify-between items-center text-xl font-bold text-[#3e2f25] pt-4 border-t border-[#e6d9c6]">
                  <span>Total Amount</span>
                  <span className="text-2xl text-[#8b4513]">
                    KWD {(cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0) + 2).toFixed(3)}
                  </span>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold text-[#3e2f25] mb-4">Payment Method</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Credit/Debit Card */}
                  <button
                    onClick={() => setPaymentMethod("CARD")}
                    className={`p-4 border-2 rounded-xl text-left transition-all duration-300 ${
                      paymentMethod === "CARD" 
                        ? "border-[#8b4513] bg-[#fdf8f3] shadow-md scale-105" 
                        : "border-[#e6d9c6] hover:border-[#d4b996] hover:scale-105"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === "CARD" ? "border-[#8b4513] bg-[#8b4513]" : "border-gray-300"
                      }`}>
                        {paymentMethod === "CARD" && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-[#3e2f25]">Credit/Debit Card</p>
                        <p className="text-sm text-[#5a4436]">Visa, Mastercard, American Express</p>
                      </div>
                    </div>
                  </button>

                  {/* KNET */}
                  <button
                    onClick={() => setPaymentMethod("KNET")}
                    className={`p-4 border-2 rounded-xl text-left transition-all duration-300 ${
                      paymentMethod === "KNET" 
                        ? "border-[#8b4513] bg-[#fdf8f3] shadow-md scale-105" 
                        : "border-[#e6d9c6] hover:border-[#d4b996] hover:scale-105"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === "KNET" ? "border-[#8b4513] bg-[#8b4513]" : "border-gray-300"
                      }`}>
                        {paymentMethod === "KNET" && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-[#3e2f25]">KNET</p>
                        <p className="text-sm text-[#5a4436]">Local Kuwaiti payment</p>
                      </div>
                    </div>
                  </button>

                  {/* Cash on Delivery */}
                  <button
                    onClick={() => setPaymentMethod("COD")}
                    className={`p-4 border-2 rounded-xl text-left transition-all duration-300 ${
                      paymentMethod === "COD" 
                        ? "border-[#8b4513] bg-[#fdf8f3] shadow-md scale-105" 
                        : "border-[#e6d9c6] hover:border-[#d4b996] hover:scale-105"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === "COD" ? "border-[#8b4513] bg-[#8b4513]" : "border-gray-300"
                      }`}>
                        {paymentMethod === "COD" && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-[#3e2f25]">Cash on Delivery</p>
                        <p className="text-sm text-[#5a4436]">Pay when you receive</p>
                      </div>
                    </div>
                  </button>

                  {/* Apple Pay */}
                  <button
                    onClick={() => setPaymentMethod("APPLE_PAY")}
                    className={`p-4 border-2 rounded-xl text-left transition-all duration-300 ${
                      paymentMethod === "APPLE_PAY" 
                        ? "border-[#8b4513] bg-[#fdf8f3] shadow-md scale-105" 
                        : "border-[#e6d9c6] hover:border-[#d4b996] hover:scale-105"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === "APPLE_PAY" ? "border-[#8b4513] bg-[#8b4513]" : "border-gray-300"
                      }`}>
                        {paymentMethod === "APPLE_PAY" && (
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-[#3e2f25]">Apple Pay</p>
                        <p className="text-sm text-[#5a4436]">Fast and secure</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Navigation Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-[#e6d9c6]">
                <button
                  onClick={() => setStep(1)}
                  className="flex-1 px-6 py-3 bg-transparent border-2 border-[#8b4513] text-[#8b4513] rounded-xl font-semibold hover:bg-[#8b4513] hover:text-white transform hover:scale-105 transition-all duration-300"
                >
                  Back to Shipping
                </button>

                <button
                  onClick={handlePlaceOrder}
                  className="flex-1 px-6 py-3 bg-[#8b4513] text-white rounded-xl font-semibold hover:bg-[#6b3410] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <span>Place Order</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  </>
);

}

// ✅ Server-side props
export const getServerSideProps: GetServerSideProps = async (context) => {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session?.user?.id) {
    return {
      redirect: { destination: "/login", permanent: false },
    };
  }

  // Fetch user info
  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      firstName: true,
      lastName: true,
      role: true,
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
        role: session.user.role,
        ...(dbUser || {}),
      },
      cartItems,
      categories,
    },
  };
};
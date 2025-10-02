// pages/profile.tsx:
import Head from 'next/head'
import { useState } from "react";
import { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";
import { prisma } from "../lib/prisma";
import Layout from "../components/header";
import CustomModal from "../components/CustomModal";

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

interface ProfilePageProps {
  userProfile: {
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName?: string;
    dob?: string;
    gender?: string;
    phoneNumber?: string;
    address1?: string;
    address2?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    createdAt: string;
  };
  categories: Category[];
  user: User;
}

interface ModalState {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: (() => void) | null;
  type: 'danger' | 'warning' | 'success' | 'info';
  confirmText?: string;
  cancelText?: string;
}

export default function ProfilePage({ userProfile, categories, user }: ProfilePageProps) {
  const [form, setForm] = useState({ ...userProfile });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // Modal state
  const [modal, setModal] = useState<ModalState>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null,
    type: 'warning'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/profile/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update profile");
      
      setMessage("Profile updated successfully!");
      setMessageType('success');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMessage(err.message);
      } else {
        setMessage("An unexpected error occurred");
      }
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  // Modal handlers
  const showModal = (
    title: string, 
    message: string, 
    onConfirm: () => void, 
    type: 'danger' | 'warning' | 'success' | 'info' = 'warning',
    confirmText?: string,
    cancelText?: string
  ) => {
    setModal({
      isOpen: true,
      title,
      message,
      onConfirm,
      type,
      confirmText,
      cancelText
    });
  };

  const closeModal = () => {
    setModal({
      isOpen: false,
      title: '',
      message: '',
      onConfirm: null,
      type: 'warning'
    });
  };

  const handleModalConfirm = () => {
    if (modal.onConfirm) {
      modal.onConfirm();
    }
    closeModal();
  };

  const handleDeleteAccount = async () => {
    showModal(
      "Delete Account",
      "Are you sure you want to delete your account? This action is irreversible and all your data will be permanently removed. You will be logged out immediately.",
      async () => {
        try {
          const res = await fetch("/api/profile/delete", { method: "POST" });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to delete account");

          // Redirect to login page after successful deletion
          window.location.href = "/login";
        } catch (err: unknown) {
          if (err instanceof Error) {
            setMessage(err.message);
            setMessageType('error');
          } else {
            setMessage("An unexpected error occurred while deleting your account");
            setMessageType('error');
          }
        }
      },
      'danger',
      'Delete Account',
      'Cancel'
    );
  };

  return (
    <>
      <Head>
        <title>My Profile | Vintage Marketplace</title>
        <meta name="description" content="Manage your account details and preferences on Vintage Marketplace." />
      </Head>

      {/* Custom Modal */}
      <CustomModal
        isOpen={modal.isOpen}
        onClose={closeModal}
        onConfirm={handleModalConfirm}
        title={modal.title}
        message={modal.message}
        type={modal.type}
        confirmText={modal.confirmText}
        cancelText={modal.cancelText}
      />

      <Layout categories={categories} user={user}>
        <div className="min-h-screen bg-[#fefaf5] py-8 px-4 sm:px-6">
          <div className="max-w-4xl mx-auto">
            {/* Header Section */}
            <div className="text-center mb-8 sm:mb-12">
              <h1 className="text-3xl sm:text-4xl font-bold text-[#3e2f25] mb-4">
                My Profile
              </h1>
              <p className="text-lg text-[#5a4436] max-w-2xl mx-auto">
                Manage your account details and keep your information up to date
              </p>
            </div>

            {/* Profile Form Card */}
            <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
              {message && (
                <div className={`p-4 rounded-xl mb-6 text-center ${
                  messageType === 'success' 
                    ? 'bg-green-50 border border-green-200 text-green-700' 
                    : 'bg-red-50 border border-red-200 text-red-700'
                }`}>
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Personal Information Section */}
                <section className="space-y-6">
                  <div className="border-b border-[#e6d9c6] pb-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#3e2f25] flex items-center space-x-3">
                      <div className="w-8 h-8 bg-[#8b4513] rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                      <span>Personal Information</span>
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-[#3e2f25] mb-3">
                        First Name *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={form.firstName}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#3e2f25] mb-3">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={form.lastName || ""}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#3e2f25] mb-3">
                        Email Address
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-[#f5f0e8] border border-[#e6d9c6] rounded-xl text-[#7a6a5a] cursor-not-allowed"
                        disabled
                        tabIndex={-1}
                        required
                      />
                      <p className="text-xs text-[#9ca3af] mt-2">Email cannot be changed</p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#3e2f25] mb-3">
                        Phone Number
                      </label>
                      <input
                        type="text"
                        name="phoneNumber"
                        value={form.phoneNumber || ""}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
                        placeholder="+965 XXX XXX"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#3e2f25] mb-3">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        name="dob"
                        value={form.dob?.slice(0, 10) || ""}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#3e2f25] mb-3">
                        Gender
                      </label>
                      <select
                        name="gender"
                        value={form.gender || ""}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
                      >
                        <option value="">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </section>

                {/* Address Information Section */}
                <section className="space-y-6">
                  <div className="border-b border-[#e6d9c6] pb-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#3e2f25] flex items-center space-x-3">
                      <div className="w-8 h-8 bg-[#8b4513] rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      <span>Address Information</span>
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-[#3e2f25] mb-3">
                        Address Line 1
                      </label>
                      <input
                        type="text"
                        name="address1"
                        value={form.address1 || ""}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
                        placeholder="Street address, P.O. box, company name"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-sm font-semibold text-[#3e2f25] mb-3">
                        Address Line 2
                      </label>
                      <input
                        type="text"
                        name="address2"
                        value={form.address2 || ""}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
                        placeholder="Apartment, suite, unit, building, floor, etc."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#3e2f25] mb-3">
                        State / Province
                      </label>
                      <input
                        type="text"
                        name="state"
                        value={form.state || ""}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#3e2f25] mb-3">
                        Country
                      </label>
                      <input
                        type="text"
                        name="country"
                        value={form.country || ""}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#3e2f25] mb-3">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        name="postalCode"
                        value={form.postalCode || ""}
                        onChange={handleChange}
                        className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
                        placeholder="XXXXX"
                      />
                    </div>
                  </div>
                </section>

                {/* Account Information Section */}
                <section className="space-y-6">
                  <div className="border-b border-[#e6d9c6] pb-4">
                    <h2 className="text-xl sm:text-2xl font-bold text-[#3e2f25] flex items-center space-x-3">
                      <div className="w-8 h-8 bg-[#8b4513] rounded-full flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </div>
                      <span>Account Information</span>
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-[#3e2f25] mb-3">
                        Account Role
                      </label>
                      <div className="px-4 py-3 bg-[#f5f0e8] border border-[#e6d9c6] rounded-xl text-[#7a6a5a]">
                        {form.role.charAt(0).toUpperCase() + form.role.slice(1).toLowerCase()}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-[#3e2f25] mb-3">
                        Member Since
                      </label>
                      <div className="px-4 py-3 bg-[#f5f0e8] border border-[#e6d9c6] rounded-xl text-[#7a6a5a]">
                        {new Date(form.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </div>
                    </div>
                  </div>
                </section>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-[#e6d9c6]">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-4 bg-[#8b4513] text-white rounded-xl font-bold hover:bg-[#6b3410] transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center space-x-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Saving Changes...</span>
                      </div>
                    ) : (
                      'Save Changes'
                    )}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    className="flex-1 py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    <span>Delete Account</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Layout>
    </>
  );
}

// --- Server-side fetch ---
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session?.user?.id) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  // Fetch user profile
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  // Fetch categories
  const categories = await prisma.category.findMany({
    select: { id: true, title: true, order: true, parentId: true },
    orderBy: { order: "asc" },
  });

  return {
    props: {
      userProfile: {
        id: user?.id || "",
        email: user?.email || "",
        role: user?.role || "",
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        dob: user?.dob?.toISOString() || null,
        gender: user?.gender || null,
        phoneNumber: user?.phoneNumber || null,
        address1: user?.address1 || null,
        address2: user?.address2 || null,
        state: user?.state || null,
        country: user?.country || null,
        postalCode: user?.postalCode || null,
        createdAt: user?.createdAt.toISOString() || "",
      },
      categories,
      user: {
        id: session.user.id,
        name: session.user.name || user?.firstName || "Guest",
        role: session.user.role,
      },
    },
  };
}
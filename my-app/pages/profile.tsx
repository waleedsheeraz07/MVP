// pages/profile.tsx:
import { useState } from "react";
import { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";
import { prisma } from "../lib/prisma";
import Layout from "../components/header";

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

export default function ProfilePage({ userProfile, categories, user }: ProfilePageProps) {
  const [form, setForm] = useState({ ...userProfile });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

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
    } catch (err: unknown) {
      if (err instanceof Error) {
        setMessage(err.message);
      } else {
        setMessage("An unexpected error occurred");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout categories={categories} user={user}>
      <div className="min-h-screen bg-[#fdf8f3] p-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-[#3e2f25] text-center sm:text-left">
            My Profile
          </h1>

          <form
            onSubmit={handleSubmit}
            className="bg-[#fffdfb] shadow-md rounded-2xl p-6 space-y-6"
          >
            {message && (
              <p className="text-center text-sm font-medium text-[#5a4436]">{message}</p>
            )}

            {/* Personal Info */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-[#3e2f25] border-b pb-2">
                Personal Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-600 font-medium">First Name</label>
                  <input
                    type="text"
                    name="firstName"
                    value={form.firstName}
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="text-gray-600 font-medium">Last Name</label>
                  <input
                    type="text"
                    name="lastName"
                    value={form.lastName || ""}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="text-gray-600 font-medium">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="text-gray-600 font-medium">Phone Number</label>
                  <input
                    type="text"
                    name="phoneNumber"
                    value={form.phoneNumber || ""}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="text-gray-600 font-medium">Date of Birth</label>
                  <input
                    type="date"
                    name="dob"
                    value={form.dob?.slice(0, 10) || ""}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="text-gray-600 font-medium">Gender</label>
                  <select
                    name="gender"
                    value={form.gender || ""}
                    onChange={handleChange}
                    className="input"
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Address Info */}
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-[#3e2f25] border-b pb-2">
                Address Information
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-600 font-medium">Address 1</label>
                  <input
                    type="text"
                    name="address1"
                    value={form.address1 || ""}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="text-gray-600 font-medium">Address 2</label>
                  <input
                    type="text"
                    name="address2"
                    value={form.address2 || ""}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="text-gray-600 font-medium">State</label>
                  <input
                    type="text"
                    name="state"
                    value={form.state || ""}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="text-gray-600 font-medium">Country</label>
                  <input
                    type="text"
                    name="country"
                    value={form.country || ""}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
                <div>
                  <label className="text-gray-600 font-medium">Postal Code</label>
                  <input
                    type="text"
                    name="postalCode"
                    value={form.postalCode || ""}
                    onChange={handleChange}
                    className="input"
                  />
                </div>
              </div>
            </section>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-[#3e2f25] text-[#fdf8f3] rounded-lg hover:bg-[#5a4436] transition"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
            </div>
  <div className="flex justify-between mt-4">
  <button
    onClick={async () => {
      if (!confirm("Are you sure you want to delete your account? This action cannot be undone.")) return;
      try {
        const res = await fetch("/api/profile/delete", { method: "POST" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to delete account");

        alert("Your account has been deleted.");
        window.location.href = "/login"; // redirect to login
      } catch (err: unknown) {
        if (err instanceof Error) alert(err.message);
        else alert("Unexpected error occurred");
      }
    }}
    className="px-6 py-2 bg-[#b84a2f] text-[#fdf8f3] rounded-lg hover:bg-[#9e3e25] transition"
  >
    🗑️ Delete Account
  </button>
</div>
          </form>
        </div>

        <style jsx>{`
          .input {
            width: 100%;
            padding: 0.5rem 0.75rem;
            border-radius: 0.75rem;
            border: 1px solid #ccc;
            background-color: #fff;
            color: #3e2f25;
          }
          .input:focus {
            outline: none;
            border-color: #5a4436;
            box-shadow: 0 0 0 2px rgba(93, 67, 47, 0.2);
          }
        `}</style>
      </div>
    </Layout>
  );
}

// --- Server-side fetch ---
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session?.user?.id) {
    return { redirect: { destination: "/auth/signin", permanent: false } };
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
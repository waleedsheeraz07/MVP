import { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";
import prisma from "../lib/prisma";

interface ProfilePageProps {
  user: {
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
}

export default function ProfilePage({ user }: ProfilePageProps) {
  return (
    <div className="min-h-screen bg-[#fdf8f3] p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-[#3e2f25] text-center sm:text-left">
          My Profile
        </h1>

        <div className="bg-[#fffdfb] shadow-md rounded-2xl p-6 space-y-6">
          {/* Personal Info */}
          <section className="space-y-3">
            <h2 className="text-xl font-semibold text-[#3e2f25] border-b pb-2">
              Personal Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-600 font-medium">First Name</p>
                <p className="text-[#3e2f25]">{user.firstName || "-"}</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium">Last Name</p>
                <p className="text-[#3e2f25]">{user.lastName || "-"}</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium">Email</p>
                <p className="text-[#3e2f25]">{user.email}</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium">Phone Number</p>
                <p className="text-[#3e2f25]">{user.phoneNumber || "-"}</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium">Date of Birth</p>
                <p className="text-[#3e2f25]">{user.dob ? new Date(user.dob).toLocaleDateString() : "-"}</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium">Gender</p>
                <p className="text-[#3e2f25]">{user.gender || "-"}</p>
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
                <p className="text-gray-600 font-medium">Address 1</p>
                <p className="text-[#3e2f25]">{user.address1 || "-"}</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium">Address 2</p>
                <p className="text-[#3e2f25]">{user.address2 || "-"}</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium">State</p>
                <p className="text-[#3e2f25]">{user.state || "-"}</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium">Country</p>
                <p className="text-[#3e2f25]">{user.country || "-"}</p>
              </div>
              <div>
                <p className="text-gray-600 font-medium">Postal Code</p>
                <p className="text-[#3e2f25]">{user.postalCode || "-"}</p>
              </div>
            </div>
          </section>

          {/* Edit Button */}
          <div className="flex justify-end">
            <button className="px-6 py-2 bg-[#3e2f25] text-[#fdf8f3] rounded-lg hover:bg-[#5a4436] transition">
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Server-side fetch ---
export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session?.user?.id) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });

  return {
    props: {
      user: {
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
    },
  };
}
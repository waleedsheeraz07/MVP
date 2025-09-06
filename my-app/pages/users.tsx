// pages/users.tsx
import { prisma } from "../lib/prisma";
import { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";
import Layout from "../components/header";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

interface UsersPageProps {
  users: User[];
  userName: string;
  categories: { id: string; title: string; order: number; parentId?: string | null }[];
}

export default function UsersPage({ users, userName, categories }: UsersPageProps) {
  return (
    <Layout categories={categories} user={{ name: userName }}>
      <div className="min-h-screen p-6 bg-[#fdf8f3] font-sans">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-[#3e2f25] mb-6">
            👥 All Users
          </h1>

          {users.length === 0 ? (
            <p className="text-gray-600">No users found.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl shadow bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-[#f0e6df] text-[#3e2f25]">
                  <tr>
                    <th className="px-4 py-2 text-left">Name</th>
                    <th className="px-4 py-2 text-left">Email</th>
                    <th className="px-4 py-2 text-left">Role</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id} className="border-t">
                      <td className="px-4 py-2">{u.name || "—"}</td>
                      <td className="px-4 py-2">{u.email}</td>
                      <td className="px-4 py-2 font-semibold">{u.role}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  // Only admins can view this page
  if (session.user.role !== "ADMIN") {
    return { redirect: { destination: "/", permanent: false } };
  }

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true },
    orderBy: { createdAt: "desc" },
  });

  const categories = await prisma.category.findMany({
    select: { id: true, title: true, order: true, parentId: true },
    orderBy: { order: "asc" },
  });

  return {
    props: {
      users,
      categories,
      userName: session.user.name || "Admin",
    },
  };
}
"use client";

import { prisma } from "../lib/prisma";
import { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";
import Layout from "../components/header";
import { useState } from "react";

interface User {
  id: string;
  firstName: string;
  lastName?: string | null;
  email: string;
  role: string;
  gender?: string | null;
  phoneNumber?: string | null;
  dob?: string | null;
  address1?: string | null;
  address2?: string | null;
  state?: string | null;
  country?: string | null;
  postalCode?: string | null;
  createdAt: string;
}

interface UsersPageProps {
  users: User[];
  userName: string;
  currentUserId: string;
  categories: { id: string; title: string; order: number; parentId?: string | null }[];
}

export default function UsersPage({ users, userName, currentUserId, categories }: UsersPageProps) {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [userList, setUserList] = useState(users);

  const toggleExpand = (id: string) => setExpanded(expanded === id ? null : id);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this account? This action is irreversible.")) return;
    try {
      const res = await fetch("/api/users/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to delete user");
      setUserList(userList.filter(u => u.id !== id));
      setExpanded(null);
    } catch (err) {
      alert("Error deleting user: " + (err as Error).message);
    }
  };

  const handleBlock = async (id: string) => {
    if (!confirm("Are you sure you want to block this user?")) return;
    try {
      const res = await fetch("/api/users/block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to block user");
      setUserList(userList.map(u => u.id === id ? { ...u, role: "BLOCKED" } : u));
    } catch (err) {
      alert("Error blocking user: " + (err as Error).message);
    }
  };

  const handleUnblock = async (id: string) => {
    if (!confirm("Are you sure you want to unblock this user?")) return;
    try {
      const res = await fetch("/api/users/unblock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to unblock user");
      setUserList(userList.map(u => u.id === id ? { ...u, role: "USER" } : u));
    } catch (err) {
      alert("Error unblocking user: " + (err as Error).message);
    }
  };

  return (
    <Layout categories={categories} user={{ id: currentUserId, name: userName }}>
      <div className="min-h-screen p-6 bg-[#fdf8f3] font-sans">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-[#3e2f25] mb-6">👥 All Users</h1>

          {userList.filter(u => u.role !== "DELETED").length === 0 ? (
            <p className="text-gray-600">No users found.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {userList
                .filter(u => u.role !== "DELETED")
                .map(u => (
                  <div key={u.id} className="bg-white rounded-xl shadow p-4 border border-gray-200 flex flex-col">
                    {/* Basic Info */}
                    <div className="flex justify-between items-center">
                      <div>
                        <h2 className="text-lg font-semibold text-[#3e2f25]">
                          {u.firstName} {u.lastName || ""}
                        </h2>
                        <p className="text-sm text-gray-600">{u.email}</p>
                        <p className="mt-1 text-sm"><span className="font-medium">Role:</span> {u.role}</p>
                        <p className="text-sm"><span className="font-medium">Gender:</span> {u.gender || "—"}</p>
                        <p className="text-sm"><span className="font-medium">Phone:</span> {u.phoneNumber || "—"}</p>
                      </div>
                      <button
                        onClick={() => toggleExpand(u.id)}
                        className="text-sm text-blue-600 hover:underline ml-4"
                      >
                        {expanded === u.id ? "Hide ▲" : "View ▼"}
                      </button>
                    </div>

                    {/* Expanded Info */}
                    {expanded === u.id && (
                      <div className="mt-4 border-t pt-3 text-sm text-gray-700 space-y-1">
                        <p><span className="font-medium">DOB:</span> {u.dob ? new Date(u.dob).toLocaleDateString() : "—"}</p>
                        <p><span className="font-medium">Address 1:</span> {u.address1 || "—"}</p>
                        <p><span className="font-medium">Address 2:</span> {u.address2 || "—"}</p>
                        <p><span className="font-medium">State:</span> {u.state || "—"}</p>
                        <p><span className="font-medium">Country:</span> {u.country || "—"}</p>
                        <p><span className="font-medium">Postal Code:</span> {u.postalCode || "—"}</p>
                        <p><span className="font-medium">Created At:</span> {new Date(u.createdAt).toLocaleString()}</p>

                        {/* Action Buttons */}
                        {u.id !== currentUserId && (
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleDelete(u.id)}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                            >
                              🗑️ Delete Account
                            </button>

                            {u.role === "BLOCKED" ? (
                              <button
                                onClick={() => handleUnblock(u.id)}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                              >
                                ✅ Unblock User
                              </button>
                            ) : (
                              <button
                                onClick={() => handleBlock(u.id)}
                                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                              >
                                🚫 Block User
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) return { redirect: { destination: "/login", permanent: false } };
  if (session.user.role !== "ADMIN") return { redirect: { destination: "/", permanent: false } };

  const users = await prisma.user.findMany({
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      role: true,
      gender: true,
      phoneNumber: true,
      dob: true,
      address1: true,
      address2: true,
      state: true,
      country: true,
      postalCode: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const currentUserId = session.user.id;
  const userName = session.user.name || "Admin";

  const categories = await prisma.category.findMany({
    select: { id: true, title: true, order: true, parentId: true },
    orderBy: { order: "asc" },
  });

  return {
    props: {
      users: users.map(u => ({
        ...u,
        dob: u.dob ? u.dob.toISOString() : null,
        createdAt: u.createdAt.toISOString(),
      })),
      categories,
      userName,
      currentUserId,
    },
  };
}
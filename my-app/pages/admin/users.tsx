// pages/admin/users.tsx:
"use client";

import { prisma } from "../../lib/prisma";
import { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../api/auth/[...nextauth]";
import Layout from "../../components/header";
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

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  const toggleExpand = (id: string) => setExpanded(expanded === id ? null : id);

  const resetFilters = () => {
    setSearch("");
    setRoleFilter("ALL");
  };

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
      setUserList(userList.map(u => (u.id === id ? { ...u, role: "BLOCKED" } : u)));
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
      setUserList(userList.map(u => (u.id === id ? { ...u, role: "USER" } : u)));
    } catch (err) {
      alert("Error unblocking user: " + (err as Error).message);
    }
  };

  const handlePromote = async (id: string) => {
    if (!confirm("Are you sure you want to promote this user to Manager?")) return;
    try {
      const res = await fetch("/api/users/promote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to promote user");
      setUserList(userList.map(u => (u.id === id ? { ...u, role: "MANAGER" } : u)));
    } catch (err) {
      alert("Error promoting user: " + (err as Error).message);
    }
  };

  const handleDemote = async (id: string) => {
    if (!confirm("Are you sure you want to demote this Manager back to User?")) return;
    try {
      const res = await fetch("/api/users/demote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to demote user");
      setUserList(userList.map(u => (u.id === id ? { ...u, role: "USER" } : u)));
    } catch (err) {
      alert("Error demoting user: " + (err as Error).message);
    }
  };

  const filteredUsers = userList.filter(u => {
    if (u.role === "DELETED") return false;

    const fullName = `${u.firstName || ""} ${u.lastName || ""}`.toLowerCase();
    const searchLower = search.toLowerCase();

    const matchesSearch =
      fullName.includes(searchLower) || u.email.toLowerCase().includes(searchLower);

    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;

    return matchesSearch && matchesRole;
  });

  return (
    <Layout categories={categories} user={{ id: currentUserId, name: userName, role: session.user.role}}>
<div className="min-h-screen p-4 bg-[#fdf8f3] font-sans">
  <div className="max-w-6xl mx-auto">
    <h1 className="text-2xl sm:text-3xl font-bold text-[#3e2f25] mb-6 text-center sm:text-left">
      👥 All Users
    </h1>

    {/* Search + Role Filter + Reset */}
    <div className="flex flex-wrap gap-3 mb-6 items-center bg-white p-4 rounded-2xl shadow-sm hover:shadow-md transition">
      <input
        type="text"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="input flex-grow min-w-[150px] bg-white text-[#3e2f25]"
      />

      <select
        value={roleFilter}
        onChange={(e) => setRoleFilter(e.target.value)}
        className="input bg-white text-[#3e2f25]"
      >
        <option value="ALL">All Roles</option>
        <option value="USER">User</option>
        <option value="MANAGER">Manager</option>
        <option value="ADMIN">Admin</option>
        <option value="BLOCKED">Blocked</option>
      </select>

      <button
        onClick={resetFilters}
        className="px-4 py-2 bg-[#5a4436] text-white rounded-xl hover:bg-[#3e2f25] transition"
      >
        🔄 Reset
      </button>
    </div>

    {/* Users Grid */}
    {filteredUsers.length === 0 ? (
      <p className="text-center text-[#3e2f25] font-medium mt-6">No users found.</p>
    ) : (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filteredUsers.map((u) => (
          <div
            key={u.id}
            className="bg-[#fffdfb] rounded-2xl shadow-md p-4 border border-[#ccc] flex flex-col"
          >
            {/* Basic Info */}
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-lg font-semibold text-[#3e2f25]">
                  {u.firstName} {u.lastName || ""}
                </h2>
                <p className="text-sm text-[#5a4436]">{u.email}</p>
                <p className="mt-1 text-sm">
                  <span className="font-medium">Role:</span> {u.role}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Gender:</span> {u.gender || "—"}
                </p>
              </div>
              <button
                onClick={() => toggleExpand(u.id)}
                className="text-sm text-[#5a4436] hover:underline ml-4"
              >
                {expanded === u.id ? "Hide ▲" : "View ▼"}
              </button>
            </div>

            {/* Expanded Info + Actions */}
            {expanded === u.id && (
              <div className="mt-4 border-t border-[#ccc] pt-3 text-sm text-[#3e2f25] space-y-2">
                <p>
                  <span className="font-medium">Phone:</span> {u.phoneNumber || "—"}
                </p>
                <p>
                  <span className="font-medium">DOB:</span>{" "}
                  {u.dob ? new Date(u.dob).toLocaleDateString() : "—"}
                </p>
                <p>
                  <span className="font-medium">Address 1:</span> {u.address1 || "—"}
                </p>
                <p>
                  <span className="font-medium">Address 2:</span> {u.address2 || "—"}
                </p>
                <p>
                  <span className="font-medium">State:</span> {u.state || "—"}
                </p>
                <p>
                  <span className="font-medium">Country:</span> {u.country || "—"}
                </p>
                <p>
                  <span className="font-medium">Postal Code:</span> {u.postalCode || "—"}
                </p>
                <p>
                  <span className="font-medium">Created At:</span>{" "}
                  {new Date(u.createdAt).toLocaleString()}
                </p>

                <div className="flex flex-wrap gap-2 mt-2">
                  {u.id !== currentUserId && (
                    <>
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="px-4 py-2 bg-[#5a4436] text-white rounded-xl hover:bg-[#3e2f25] transition"
                      >
                        🗑️ Delete
                      </button>

                      {u.role === "BLOCKED" ? (
                        <button
                          onClick={() => handleUnblock(u.id)}
                          className="px-4 py-2 bg-[#d4a953] text-white rounded-xl hover:bg-[#b37a40] transition"
                        >
                          ✅ Unblock
                        </button>
                      ) : (
                        <button
                          onClick={() => handleBlock(u.id)}
                          className="px-4 py-2 bg-[#d4a953] text-white rounded-xl hover:bg-[#b37a40] transition"
                        >
                          🚫 Block
                        </button>
                      )}

                      {u.role === "MANAGER" ? (
                        <button
                          onClick={() => handleDemote(u.id)}
                          className="px-4 py-2 bg-[#8c6a4d] text-white rounded-xl hover:bg-[#6b4d37] transition"
                        >
                          ⬇️ Demote
                        </button>
                      ) : (
                        u.role !== "ADMIN" && (
                          <button
                            onClick={() => handlePromote(u.id)}
                            className="px-4 py-2 bg-[#9b59b6] text-white rounded-xl hover:bg-[#7b3d99] transition"
                          >
                            ⭐ Promote
                          </button>
                        )
                      )}
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    )}
  </div>

  <style jsx>{`
    .input {
      padding: 0.5rem 0.75rem;
      border-radius: 0.75rem;
      border: 1px solid #ccc;
      transition: border 0.2s, box-shadow 0.2s;
    }
    .input:focus {
      outline: none;
      border-color: #5a4436;
      box-shadow: 0 0 0 2px rgba(90, 68, 54, 0.2);
    }
  `}</style>
</div>
    </Layout>
  );
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) return { redirect: { destination: "/login", permanent: false } };
  if (session.user.role !== "ADMIN")
    return { redirect: { destination: "/", permanent: false } };

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
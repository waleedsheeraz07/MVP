// pages/admin/users.tsx:
"use client";

import Head from 'next/head'
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
  role: string;
}

export default function UsersPage({ users, userName, currentUserId, categories, role}: UsersPageProps) {
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
  <>
    <Head>
      <title>Manage Users | Vintage Marketplace</title>
      <meta name="description" content="Admin dashboard for managing buyers and sellers on the marketplace." />
    </Head>
    
    <Layout categories={categories} user={{ id: currentUserId, name: userName, role: role}}>
      <div className="min-h-screen bg-[#fefaf5] py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-8 sm:mb-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#3e2f25] mb-4">
              Manage Users
            </h1>
            <p className="text-lg text-[#5a4436] max-w-2xl mx-auto">
              Admin dashboard for managing buyers and sellers on the marketplace
            </p>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-center">
              {/* Search Input */}
              <div className="flex-1 w-full lg:max-w-md">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] placeholder-[#9ca3af] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
                  />
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#8b4513]">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Role Filter */}
              <div className="w-full lg:w-48">
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full px-4 py-3 bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl text-[#3e2f25] focus:outline-none focus:ring-2 focus:ring-[#8b4513] focus:border-transparent transition-all duration-300"
                >
                  <option value="ALL">All Roles</option>
                  <option value="USER">User</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                  <option value="BLOCKED">Blocked</option>
                </select>
              </div>

              {/* Reset Button */}
              <button
                onClick={resetFilters}
                className="flex items-center justify-center space-x-2 px-6 py-3 bg-transparent border-2 border-[#8b4513] text-[#8b4513] rounded-xl font-semibold hover:bg-[#8b4513] hover:text-white transform hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>Reset Filters</span>
              </button>
            </div>
          </div>

          {/* Users List */}
          {filteredUsers.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-[#e6d9c6] rounded-full flex items-center justify-center">
                <svg className="w-12 h-12 text-[#8b4513]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-[#3e2f25] mb-2">No users found</h3>
              <p className="text-[#5a4436]">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredUsers.map((u) => (
                <div
                  key={u.id}
                  className="group bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-500 hover:scale-105"
                >
                  {/* User Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 pb-4 border-b border-[#e6d9c6]">
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-[#3e2f25] mb-2">
                        {u.firstName} {u.lastName || ""}
                      </h2>
                      <div className="flex flex-wrap gap-4 text-sm text-[#5a4436]">
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                          </svg>
                          <span>{u.email}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>Role: {u.role}</span>
                        </div>
                        {u.gender && (
                          <div className="flex items-center space-x-1">
                            <span>Gender: {u.gender}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => toggleExpand(u.id)}
                      className="flex items-center space-x-2 px-4 py-2 bg-[#fdf8f3] border border-[#e6d9c6] text-[#8b4513] rounded-xl font-medium hover:bg-[#e6d9c6] transform hover:scale-105 transition-all duration-300 cursor-pointer mt-3 sm:mt-0"
                    >
                      <span>{expanded === u.id ? "Hide Details" : "View Details"}</span>
                      <svg className={`w-4 h-4 transform transition-transform ${expanded === u.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  </div>

                  {/* Expanded User Details */}
                  {expanded === u.id && (
                    <div className="mt-4 space-y-4">
                      {/* Contact Information */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-[#5a4436]">
                        <div>
                          <p className="font-semibold text-[#3e2f25] mb-1">Contact Information</p>
                          {u.phoneNumber && (
                            <p className="flex items-center space-x-2">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                              <span>{u.phoneNumber}</span>
                            </p>
                          )}
                          {u.dob && (
                            <p className="flex items-center space-x-2 mt-1">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              <span>DOB: {new Date(u.dob).toLocaleDateString()}</span>
                            </p>
                          )}
                        </div>

                        <div>
                          <p className="font-semibold text-[#3e2f25] mb-1">Account Information</p>
                          <p className="flex items-center space-x-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>Joined: {new Date(u.createdAt).toLocaleDateString()}</span>
                          </p>
                        </div>
                      </div>

                      {/* Address Information */}
                      {(u.address1 || u.state || u.country) && (
                        <div className="bg-[#fdf8f3] border border-[#e6d9c6] rounded-xl p-4">
                          <p className="font-semibold text-[#3e2f25] text-sm mb-2">Address Information</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-[#5a4436]">
                            {u.address1 && <p>Address 1: {u.address1}</p>}
                            {u.address2 && <p>Address 2: {u.address2}</p>}
                            {u.state && <p>State: {u.state}</p>}
                            {u.country && <p>Country: {u.country}</p>}
                            {u.postalCode && <p>Postal Code: {u.postalCode}</p>}
                          </div>
                        </div>
                      )}

                      {/* Action Buttons */}
                      {u.id !== currentUserId && (
                        <div className="flex flex-wrap gap-3 pt-4 border-t border-[#e6d9c6]">
                          <button
                            onClick={() => handleDelete(u.id)}
                            className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            <span>Delete User</span>
                          </button>

                          {u.role === "BLOCKED" ? (
                            <button
                              onClick={() => handleUnblock(u.id)}
                              className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <span>Unblock User</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBlock(u.id)}
                              className="flex items-center space-x-2 px-4 py-2 bg-yellow-600 text-white rounded-xl font-semibold hover:bg-yellow-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              <span>Block User</span>
                            </button>
                          )}

                          {u.role === "MANAGER" ? (
                            <button
                              onClick={() => handleDemote(u.id)}
                              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                              <span>Demote to User</span>
                            </button>
                          ) : (
                            u.role !== "ADMIN" && (
                              <button
                                onClick={() => handlePromote(u.id)}
                                className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-xl font-semibold hover:bg-purple-700 transform hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-xl"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                                </svg>
                                <span>Promote to Manager</span>
                              </button>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Users Summary */}
          {filteredUsers.length > 0 && (
            <div className="mt-12 text-center">
              <div className="bg-white rounded-2xl shadow-lg p-6 inline-block">
                <p className="text-lg text-[#3e2f25]">
                  Showing <span className="font-bold text-[#8b4513]">{filteredUsers.length}</span> 
                  {filteredUsers.length === 1 ? ' user' : ' users'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  </>
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
      role: session.user.role
    },
  };
}
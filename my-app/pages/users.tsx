// pages/users.tsx
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
  categories: { id: string; title: string; order: number; parentId?: string | null }[];
}

export default function UsersPage({ users, userName, categories }: UsersPageProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpanded(expanded === id ? null : id);
  };

  return (
    <Layout categories={categories} user={{ id: "current", name: userName }}>
      <div className="min-h-screen p-6 bg-[#fdf8f3] font-sans">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl md:text-3xl font-bold text-[#3e2f25] mb-6">
            👥 All Users
          </h1>

          {users.length === 0 ? (
            <p className="text-gray-600">No users found.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {users.map((u) => (
                <div
                  key={u.id}
                  className="bg-white rounded-xl shadow p-4 border border-gray-200"
                >
                  {/* Basic Info */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="text-lg font-semibold text-[#3e2f25]">
                        {u.firstName} {u.lastName || ""}
                      </h2>
                      <p className="text-sm text-gray-600">{u.email}</p>
                      <p className="mt-1 text-sm">
                        <span className="font-medium">Role:</span> {u.role}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Gender:</span>{" "}
                        {u.gender || "—"}
                      </p>
                      <p className="text-sm">
                        <span className="font-medium">Phone:</span>{" "}
                        {u.phoneNumber || "—"}
                      </p>
                    </div>
                    <button
                      onClick={() => toggleExpand(u.id)}
                      className="text-sm text-blue-600 hover:underline"
                    >
                      {expanded === u.id ? "Hide Details ▲" : "View Details ▼"}
                    </button>
                  </div>

                  {/* Expanded Info */}
                  {expanded === u.id && (
                    <div className="mt-4 border-t pt-3 text-sm text-gray-700 space-y-1">
                      <p>
                        <span className="font-medium">DOB:</span>{" "}
                        {u.dob ? new Date(u.dob).toLocaleDateString() : "—"}
                      </p>
                      <p>
                        <span className="font-medium">Address 1:</span>{" "}
                        {u.address1 || "—"}
                      </p>
                      <p>
                        <span className="font-medium">Address 2:</span>{" "}
                        {u.address2 || "—"}
                      </p>
                      <p>
                        <span className="font-medium">State:</span>{" "}
                        {u.state || "—"}
                      </p>
                      <p>
                        <span className="font-medium">Country:</span>{" "}
                        {u.country || "—"}
                      </p>
                      <p>
                        <span className="font-medium">Postal Code:</span>{" "}
                        {u.postalCode || "—"}
                      </p>
                      <p>
                        <span className="font-medium">Created At:</span>{" "}
                        {new Date(u.createdAt).toLocaleString()}
                      </p>
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

  if (!session) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  // Only admins can view this page
  if (session.user.role !== "ADMIN") {
    return { redirect: { destination: "/", permanent: false } };
  }

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

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { firstName: true, lastName: true },
  });

  const categories = await prisma.category.findMany({
    select: { id: true, title: true, order: true, parentId: true },
    orderBy: { order: "asc" },
  });

  return {
    props: {
      users: users.map((u) => ({
        ...u,
        dob: u.dob ? u.dob.toISOString() : null,
        createdAt: u.createdAt.toISOString(),
      })),
      categories,
      userName: currentUser
        ? `${currentUser.firstName} ${currentUser.lastName || ""}`
        : "Admin",
    },
  };
}
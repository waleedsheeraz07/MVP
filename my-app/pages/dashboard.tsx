"use client";

import { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth/next";
import { signOut } from "next-auth/react";
import Link from "next/link";
import { authOptions } from "./api/auth/[...nextauth]";

export async function getServerSideProps(context: GetServerSidePropsContext) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  return { props: { session } };
}

interface DashboardProps {
  session: {
    user: {
      name: string;
      email: string;
      role: string;
    };
  };
}

export default function Dashboard({ session }: DashboardProps) {
  return (
    <div
      style={{
        minHeight: "100vh",
        padding: "2rem",
        fontFamily: "sans-serif",
        backgroundColor: "#f9f9f9",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "2rem",
      }}
    >
      <div
        style={{
          background: "#fff",
          padding: "2rem",
          borderRadius: "12px",
          boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
          width: "100%",
          maxWidth: "500px",
          textAlign: "center",
        }}
      >
        <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>
          Welcome, {session.user.name}
        </h1>
        <p style={{ marginBottom: "0.5rem" }}>Email: {session.user.email}</p>
        <p style={{ marginBottom: "1.5rem" }}>Role: {session.user.role}</p>

        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/products">
            <button
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#4f46e5",
                color: "#fff",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Products
            </button>
          </Link>

          <Link href="/sell">
            <button
              style={{
                padding: "0.75rem 1.5rem",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#10b981",
                color: "#fff",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Sell Product
            </button>
          </Link>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            style={{
              padding: "0.75rem 1.5rem",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#ef4444",
              color: "#fff",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}
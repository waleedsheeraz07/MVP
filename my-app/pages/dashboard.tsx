Ok now it is working great when i login it takes me to the dashboard page and says welcome, my email
Role: my role
But when i press signout it redirects me to localhost:3000 and ahows blank page but when i come back to dashboard it redirects me to login page:

import { GetServerSidePropsContext } from "next";
import { getServerSession } from "next-auth/next";
import { signOut } from "next-auth/react";
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
  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: "/login" });
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Welcome, {session.user.name}</h1> {/* ✅ show name */}
      <p>Email: {session.user.email}</p>
      <p>Role: {session.user.role}</p>
      <button onClick={handleLogout} style={{ padding: "0.5rem 1rem", cursor: "pointer" }}>
        Logout
      </button>
    </div>
  );
}
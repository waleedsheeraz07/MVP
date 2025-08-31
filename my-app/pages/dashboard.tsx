
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

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Welcome, {session.user.name}</h1> {/* ✅ show name */}
      <p>Email: {session.user.email}</p>
      <p>Role: {session.user.role}</p>
       <button onClick={() => signOut({ callbackUrl: "/login" })}>Logout</button>
    </div>
  );
}
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
      email: string;
      role: string;
    };
  };
}

export default function Dashboard({ session }: DashboardProps) {
  return (
    <div>
      <h1>Welcome, {session.user.email}</h1>
      <p>Role: {session.user.role}</p>
      <button onClick={() => signOut()}>Logout</button>
    </div>
  );
}
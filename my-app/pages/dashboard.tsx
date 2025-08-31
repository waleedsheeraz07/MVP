import { getServerSession } from "next-auth/next";
import { authOptions } from "./api/auth/[...nextauth]";

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return { redirect: { destination: "/login", permanent: false } };
  }

  return { props: { session } };
}

export default function Dashboard({ session }) {
  return (
    <div>
      <h1>Welcome, {session.user.email}</h1>
      <p>Role: {session.user.role}</p>
      <button onClick={() => signOut()}>Logout</button>
    </div>
  );
}
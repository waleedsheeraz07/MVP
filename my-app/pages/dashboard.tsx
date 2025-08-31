"use client";

import { useSession, signOut } from "next-auth/react";

export default function Dashboard() {
  const { data: session } = useSession();

  if (!session) return <p>Loading...</p>;

  return (
    <div>
      <h1>Welcome, {session.user?.name || session.user?.email}</h1>
      <button onClick={() => signOut()}>Logout</button>
    </div>
  );
}
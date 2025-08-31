interface DashboardProps {
  session: {
    user: {
      id: string;
      name: string; // ✅ add name
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
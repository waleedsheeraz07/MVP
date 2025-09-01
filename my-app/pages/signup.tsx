import { useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";

type Role = "buyer" | "seller";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("buyer");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      });

      const data: { error?: string } = await res.json();

      if (!res.ok) throw data;

      router.push("/login");
    } catch (err: unknown) {
      if (typeof err === "object" && err !== null && "error" in err) {
        setError((err as { error?: string }).error || "Signup failed, please try again");
      } else {
        setError("Signup failed, please try again");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "1rem",
        backgroundColor: "#f9f5f0",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "400px",
          backgroundColor: "#fff",
          padding: "2rem",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
        }}
      >
        <h1 style={{ textAlign: "center", marginBottom: "1.5rem", fontSize: "1.8rem" }}>Sign Up</h1>

        {error && (
          <p
            style={{
              color: "red",
              background: "#ffe5e5",
              padding: "0.75rem",
              borderRadius: "8px",
              marginBottom: "1rem",
              textAlign: "center",
            }}
          >
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <input
            type="email"
            placeholder="Email"
            required
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #ccc", width: "100%" }}
          />

          <input
            type="password"
            placeholder="Password"
            required
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #ccc", width: "100%" }}
          />

          <select
            value={role}
            onChange={e => setRole(e.target.value as Role)}
            style={{ padding: "0.75rem", borderRadius: "8px", border: "1px solid #ccc", width: "100%" }}
          >
            <option value="buyer">Buyer</option>
            <option value="seller">Seller</option>
          </select>

          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.75rem",
              borderRadius: "8px",
              border: "none",
              backgroundColor: "#4CAF50",
              color: "#fff",
              fontSize: "1rem",
              cursor: "pointer",
              transition: "0.2s",
            }}
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.9rem" }}>
          Already have an account?{" "}
          <Link href="/login" style={{ color: "#4CAF50", fontWeight: "bold", textDecoration: "underline" }}>
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
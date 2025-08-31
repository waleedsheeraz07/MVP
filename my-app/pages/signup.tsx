import { GetServerSideProps } from "next"

type Role = "buyer" | "seller"

interface SignupPageProps {
  logs?: string[]
  error?: string
  email?: string
  role?: Role
}

const SignupPage = ({ logs = [], error, email = "", role = "buyer" }: SignupPageProps) => {
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Sign Up</h1>

      <form method="POST" action="/api/auth/signup" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <input
          type="email"
          name="email"
          placeholder="Email"
          defaultValue={email}
          required
          style={{ padding: "0.5rem", fontSize: "1rem" }}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          style={{ padding: "0.5rem", fontSize: "1rem" }}
        />
        <select
          name="role"
          defaultValue={role}
          style={{ padding: "0.5rem", fontSize: "1rem" }}
        >
          <option value="buyer">Buyer</option>
          <option value="seller">Seller</option>
        </select>
        <button type="submit" style={{ padding: "0.5rem", fontSize: "1rem", cursor: "pointer" }}>
          Sign Up
        </button>
      </form>

      {error && <p style={{ color: "red", marginTop: "1rem" }}>{error}</p>}

      {logs.length > 0 && (
        <div style={{ marginTop: "2rem", background: "#f0f0f0", padding: "1rem", borderRadius: "8px" }}>
          <h2>Logs</h2>
          <div style={{ maxHeight: "200px", overflowY: "auto" }}>
            {logs.map((log, i) => (
              <p key={i} style={{ margin: 0 }}>{log}</p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default SignupPage
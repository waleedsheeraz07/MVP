import { useState, FormEvent } from "react"
import { useRouter } from "next/router"

const SignupPage = () => {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"buyer" | "seller">("buyer")
  const [error, setError] = useState("")
  const [logs, setLogs] = useState<string[]>([])

  // helper to append log messages
  const log = (msg: string) => setLogs(prev => [...prev, msg])

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    log("Submitting signup request...")

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      })

      log(`Response status: ${res.status}`)

      const data = await res.json().catch(() => {
        log("Failed to parse JSON response")
        return {}
      })

      log("Response data: " + JSON.stringify(data))

      if (res.ok) {
        log("Signup successful! Redirecting to login...")
        router.push("/login")
      } else {
        const errMsg = (data as any).error || "Signup failed"
        setError(errMsg)
        log("Signup error: " + errMsg)
      }
    } catch (err: unknown) {
      log("Network error: " + (err instanceof Error ? err.message : String(err)))
      setError("Signup failed due to network error")
    }
  }

  return (
    <div className="auth-container">
      <h1>Sign Up</h1>
      <form onSubmit={handleSignup}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />
        <select
          value={role}
          onChange={e => setRole(e.target.value as "buyer" | "seller")}
        >
          <option value="buyer">Buyer</option>
          <option value="seller">Seller</option>
        </select>
        <button type="submit">Sign Up</button>
        {error && <p className="error">{error}</p>}
      </form>

      <div
        style={{
          marginTop: "20px",
          padding: "10px",
          background: "#f5f5f5",
          border: "1px solid #ccc",
          maxHeight: "200px",
          overflowY: "auto",
          fontFamily: "monospace",
          fontSize: "14px",
        }}
      >
        <strong>Logs:</strong>
        {logs.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  )
}

export default SignupPage
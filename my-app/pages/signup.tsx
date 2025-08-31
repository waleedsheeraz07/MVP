"use client"

import { useState, FormEvent } from "react"
import { useRouter } from "next/router"

type Log = { type: "info" | "error"; message: string }

const SignupPage = () => {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"buyer" | "seller">("buyer")
  const [error, setError] = useState("")
  const [logs, setLogs] = useState<Log[]>([])

  const addLog = (message: string, type: "info" | "error" = "info") => {
    setLogs(prev => [...prev, { message, type }])
  }

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError("")
    addLog("Submitting signup request...")

    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, role }),
      })

      let data: any = {}
      try {
        data = await res.json()
        addLog("Response data: " + JSON.stringify(data))
      } catch (jsonErr) {
        addLog("Failed to parse JSON response", "error")
      }

      addLog(`Response status: ${res.status}`)

      if (res.ok) {
        addLog("Signup successful! Redirecting to login...")
        router.push("/login")
      } else {
        setError(data.error || "Signup failed")
        addLog(`Signup error: ${data.error || "Unknown error"}`, "error")
      }
    } catch (err: any) {
      setError("Signup failed due to network error")
      addLog("Network error: " + err.message, "error")
    }
  }

  return (
    <div className="auth-container" style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Sign Up</h1>
      <form onSubmit={handleSignup} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ padding: "0.5rem", fontSize: "1rem" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ padding: "0.5rem", fontSize: "1rem" }}
        />
        <select
          value={role}
          onChange={e => setRole(e.target.value as "buyer" | "seller")}
          style={{ padding: "0.5rem", fontSize: "1rem" }}
        >
          <option value="buyer">Buyer</option>
          <option value="seller">Seller</option>
        </select>
        <button type="submit" style={{ padding: "0.5rem", fontSize: "1rem", cursor: "pointer" }}>
          Sign Up
        </button>
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>

      <div style={{ marginTop: "2rem", background: "#f0f0f0", padding: "1rem", borderRadius: "8px" }}>
        <h2>Logs</h2>
        <div style={{ maxHeight: "200px", overflowY: "auto" }}>
          {logs.map((log, i) => (
            <p key={i} style={{ color: log.type === "error" ? "red" : "black", margin: 0 }}>
              {log.message}
            </p>
          ))}
        </div>
      </div>
    </div>
  )
}

export default SignupPage
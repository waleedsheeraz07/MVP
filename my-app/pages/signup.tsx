import { useState, FormEvent } from "react"
import { useRouter } from "next/router"

const SignupPage = () => {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [role, setRole] = useState<"buyer" | "seller">("buyer")
  const [logs, setLogs] = useState<string[]>([])

  const addLog = (msg: string) => {
    console.log(msg)
    setLogs(prev => [...prev, msg])
  }

  const handleSignup = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLogs([]) // clear previous logs

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
      } catch {
        addLog("No JSON returned from server")
      }

      addLog(`Response status: ${res.status}`)
      addLog(`Response data: ${JSON.stringify(data)}`)

      if (res.ok) {
        addLog("Signup successful!")
        router.push("/login")
      } else {
        addLog(`Signup error: ${data?.error || "Unknown error"}`)
      }
    } catch (err: any) {
      addLog(`Signup fetch error: ${err.message}`)
    }
  }

  return (
    <div style={{ maxWidth: 400, margin: "2rem auto", fontFamily: "sans-serif" }}>
      <h1>Sign Up</h1>
      <form onSubmit={handleSignup}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          style={{ width: "100%", marginBottom: "0.5rem", padding: "0.5rem" }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
          style={{ width: "100%", marginBottom: "0.5rem", padding: "0.5rem" }}
        />
        <select
          value={role}
          onChange={e => setRole(e.target.value as "buyer" | "seller")}
          style={{ width: "100%", marginBottom: "0.5rem", padding: "0.5rem" }}
        >
          <option value="buyer">Buyer</option>
          <option value="seller">Seller</option>
        </select>
        <button type="submit" style={{ padding: "0.5rem 1rem" }}>Sign Up</button>
      </form>

      <div style={{ marginTop: "1rem", background: "#f5f5f5", padding: "0.5rem" }}>
        <h3>Logs:</h3>
        {logs.map((log, i) => (
          <div key={i} style={{ fontSize: "0.9rem", color: "#333" }}>{log}</div>
        ))}
      </div>
    </div>
  )
}

export default SignupPage
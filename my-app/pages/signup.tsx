import { GetServerSideProps } from "next"
import { PrismaClient, Prisma } from "@prisma/client"
import bcrypt from "bcryptjs"
import { ParsedUrlQuery } from "querystring"

const prisma = new PrismaClient()

type Role = "buyer" | "seller"

interface SignupPageProps {
  logs: string[]
  error?: string
  email?: string
  role?: Role
}

interface FormBody extends ParsedUrlQuery {
  email?: string
  password?: string
  role?: string
}

const SignupPage = ({ logs, error, email = "", role = "buyer" }: SignupPageProps) => {
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Sign Up</h1>

      <form method="POST" style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
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
        {error && <p style={{ color: "red" }}>{error}</p>}
      </form>

      <div style={{ marginTop: "2rem", background: "#f0f0f0", padding: "1rem", borderRadius: "8px" }}>
        <h2>Logs</h2>
        <div style={{ maxHeight: "200px", overflowY: "auto" }}>
          {logs.map((log, i) => (
            <p key={i} style={{ margin: 0 }}>{log}</p>
          ))}
        </div>
      </div>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const logs: string[] = []

  if (context.req.method === "POST") {
    const body = context.req.body as FormBody

    const email = body.email?.toString() || ""
    const password = body.password?.toString() || ""
    const role = body.role?.toString() as Role | undefined

    logs.push("Submitting signup request...")

    if (!email || !password || !role) {
      logs.push("Missing required fields")
      return { props: { logs, error: "Missing required fields", email, role: role || "buyer" } }
    }

    if (role !== "buyer" && role !== "seller") {
      logs.push("Invalid role selected")
      return { props: { logs, error: "Invalid role", email, role: "buyer" } }
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10)
      const user = await prisma.user.create({
        data: { email, password: hashedPassword, role },
      })
      logs.push(`User created successfully with ID: ${user.id}`)
      logs.push("Signup complete! Redirect manually to login page.")

      return {
        props: { logs },
      }
    } catch (err: unknown) {
      let errorMessage = "Internal server error"
      if ((err as Prisma.PrismaClientKnownRequestError).code === "P2002") {
        errorMessage = "Email already exists"
      }
      logs.push(`Signup failed: ${errorMessage}`)
      return { props: { logs, error: errorMessage, email, role } }
    }
  }

  return { props: { logs } }
}

export default SignupPage
import { GetServerSideProps } from "next"
import { PrismaClient, Prisma } from "@prisma/client"
import bcrypt from "bcryptjs"

type Role = "buyer" | "seller"

interface SignupProps {
  error?: string
}

const prisma = new PrismaClient()

export default function SignupPage({ error }: SignupProps) {
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Sign Up</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form method="POST">
        <input
          type="email"
          name="email"
          placeholder="Email"
          required
          style={{ display: "block", margin: "1rem 0", padding: "0.5rem", width: "100%" }}
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
          style={{ display: "block", margin: "1rem 0", padding: "0.5rem", width: "100%" }}
        />
        <select name="role" style={{ display: "block", margin: "1rem 0", padding: "0.5rem" }}>
          <option value="buyer">Buyer</option>
          <option value="seller">Seller</option>
        </select>
        <button type="submit" style={{ padding: "0.5rem 1rem", cursor: "pointer" }}>Sign Up</button>
      </form>
    </div>
  )
}

export const getServerSideProps: GetServerSideProps<SignupProps> = async ({ req }) => {
  if (req.method !== "POST") return { props: {} }

  try {
    // Parse body
    let data = ""
    await new Promise<void>((resolve, reject) => {
      req.on("data", chunk => data += chunk)
      req.on("end", () => resolve())
      req.on("error", reject)
    })

    const params = new URLSearchParams(data)
    const email = params.get("email") || ""
    const password = params.get("password") || ""
    const role: Role = params.get("role") === "seller" ? "seller" : "buyer"

    if (!email || !password) return { props: { error: "Email and password are required" } }

    const hashedPassword = await bcrypt.hash(password, 10)

    await prisma.user.create({ data: { email, password: hashedPassword, role } })

    return { redirect: { destination: "/login", permanent: false } }
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return { props: { error: "Email already exists" } }
    }
    return { props: { error: "Signup failed, please try again" } }
  }
}
import { GetServerSideProps } from "next"
import { PrismaClient, User } from "@prisma/client"
import bcrypt from "bcryptjs"

type Role = "buyer" | "seller"

interface SignupProps {
  error?: string
}

interface FormBody {
  email: string
  password: string
  role: Role
}

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
    // Parse POST body
    const body: FormBody = await new Promise((resolve, reject) => {
      let data = ""
      req.on("data", chunk => data += chunk)
      req.on("end", () => {
        try {
          const params = new URLSearchParams(data)
          const email = params.get("email") || ""
          const password = params.get("password") || ""
          const roleParam = params.get("role") as Role
          const role: Role = roleParam === "seller" ? "seller" : "buyer"
          resolve({ email, password, role })
        } catch (err) {
          reject(err)
        }
      })
      req.on("error", reject)
    })

    if (!body.email || !body.password) {
      return { props: { error: "Email and password are required" } }
    }

    const prisma = new PrismaClient()
    const hashedPassword = await bcrypt.hash(body.password, 10)

    await prisma.user.create({
      data: {
        email: body.email,
        password: hashedPassword,
        role: body.role,
      },
    })

    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    }
  } catch (err) {
    // Properly typed error handling
    if (err instanceof Error && "code" in err && (err as any).code === "P2002") {
      return { props: { error: "Email already exists" } }
    }
    return { props: { error: "Signup failed, please try again" } }
  }
}
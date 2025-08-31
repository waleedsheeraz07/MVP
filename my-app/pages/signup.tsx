import { GetServerSideProps } from "next"

type Role = "buyer" | "seller"

interface SignupFormData {
  email?: string
  password?: string
  role?: Role
  error?: string
}

export default function SignupPage({ error }: SignupFormData) {
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Sign Up</h1>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form method="POST">
        <input
          type="email"
          name="email"
          placeholder="Emal"
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

export const getServerSideProps: GetServerSideProps = async (context) => {
  if (context.req.method === "POST") {
    const body = await new Promise<{ email: string; password: string; role: Role }>((resolve, reject) => {
      let data = ''
      context.req.on('data', chunk => data += chunk)
      context.req.on('end', () => {
        const params = new URLSearchParams(data)
        resolve({
          email: params.get('email') || '',
          password: params.get('password') || '',
          role: (params.get('role') as Role) || "buyer",
        })
      })
      context.req.on('error', reject)
    })

    if (!body.email || !body.password) {
      return { props: { error: "Email and password are required" } }
    }

    try {
      const { PrismaClient } = await import("@prisma/client")
      const bcrypt = (await import("bcryptjs")).default
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
      return { props: { error: "Signup failed, maybe email already exists" } }
    }
  }

  return { props: {} }
}
import type { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient, User } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()
type Role = "buyer" | "seller"

interface SignupResponse {
  id?: string
  email?: string
  role?: Role
  error?: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<SignupResponse>) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const { email, password, role } = req.body as { email?: string; password?: string; role?: string }

  if (!email || !password || !role) {
    return res.status(400).json({ error: "Missing required fields" })
  }

  if (role !== "buyer" && role !== "seller") {
    return res.status(400).json({ error: "Invalid role" })
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10)

    const user: User = await prisma.user.create({
      data: { email, password: hashedPassword, role: role as Role }
    })

    console.log("User created:", user)

    // Redirect back to signup page with success log
    return res.status(201).json({ id: user.id, email: user.email, role: user.role })
  } catch (err: any) {
    console.error("Signup error:", err)
    if (err.code === 11000 || err.code === "P2002") {
      return res.status(400).json({ error: "Email already exists" })
    }
    return res.status(500).json({ error: "Internal server error" })
  }
}
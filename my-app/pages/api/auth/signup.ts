import type { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient, User } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

type ApiResponse =
  | { id: string; email: string; role: "buyer" | "seller" }
  | { error: string }

interface PrismaError extends Error {
  code?: string | number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const body = req.body as { email?: string; password?: string; role?: string }

  if (!body.email || !body.password || !body.role) {
    return res.status(400).json({ error: "Missing required fields" })
  }

  const { email, password, role } = body

  if (role !== "buyer" && role !== "seller") {
    return res.status(400).json({ error: "Invalid role" })
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10)

    const user: User = await prisma.user.create({
      data: { email, password: hashedPassword, role },
    })

    console.log("User created:", user)

    // Cast role safely after checking
    const safeRole: "buyer" | "seller" =
      user.role === "buyer" ? "buyer" : "seller"

    return res.status(201).json({ id: user.id, email: user.email, role: safeRole })
  } catch (error) {
    const err = error as PrismaError
    console.error("Signup error:", err)

    if (err.code === 11000 || err.code === "P2002") {
      return res.status(400).json({ error: "Email already exists" })
    }

    return res.status(500).json({ error: "Internal server error" })
  }
}
import type { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient, User } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

interface SignupResponse {
  id?: string
  email?: string
  role?: "buyer" | "seller"
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SignupResponse>
) {
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
      data: {
        email,
        password: hashedPassword,
        role: role as "buyer" | "seller", // explicit cast fixes TypeScript
      },
    })

    return res.status(201).json({
      id: user.id,
      email: user.email,
      role: user.role as "buyer" | "seller", // ✅ cast here too
    })
  } catch (error) {
    const err = error as { code?: string | number; message?: string }

    if (err.code === "P2002") {
      return res.status(400).json({ error: "Email already exists" })
    }

    return res.status(500).json({ error: "Internal server error" })
  }
}
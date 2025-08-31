// pages/api/auth/signup.ts
import type { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient, User } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

// Response type
type SignupResponse =
  | { id: string; email: string; role: "buyer" | "seller" }
  | { error: string }

// Type-safe Prisma error
interface PrismaError extends Error {
  code?: string | number
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SignupResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const { email, password, role } = req.body as {
    email?: string
    password?: string
    role?: "buyer" | "seller"
  }

  if (!email || !password || !role) {
    return res.status(400).json({ error: "Missing required fields" })
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create user in DB
    const user: User = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role,
      },
    })

    console.log("User created:", user)

    return res
      .status(201)
      .json({ id: user.id, email: user.email, role: user.role })
  } catch (error) {
    const err = error as PrismaError
    console.error("Signup error:", err)

    // Handle duplicate email errors (Mongo + Prisma)
    if (err.code === 11000 || err.code === "P2002") {
      return res.status(400).json({ error: "Email already exists" })
    }

    return res.status(500).json({ error: "Internal server error" })
  }
}
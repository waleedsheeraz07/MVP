import type { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

type Data =
  | { id: string; email: string; role: string }
  | { error: string }

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" })
  }

  const { email, password, role } = req.body

  if (!email || !password || !role) {
    return res.status(400).json({ error: "Missing required fields" })
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
      data: { email, password: hashedPassword, role },
    })

    console.log("User created:", user) // ✅ Debugging log

    return res.status(201).json({ id: user.id, email: user.email, role: user.role })
  } catch (error: unknown) {
    console.error("Signup error:", error)

    // MongoDB duplicate key error code: 11000
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as any).code === 11000
    ) {
      return res.status(400).json({ error: "Email already exists" })
    }

    return res.status(500).json({ error: "Internal server error" })
  }
}
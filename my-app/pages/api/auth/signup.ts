// pages/api/auth/signup.ts
import type { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

interface SignUpRequestBody {
  email: string
  password: string
  role: string
}

interface SignUpResponse {
  id?: string
  email?: string
  role?: string
  error?: string
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SignUpResponse>
) {
  if (req.method !== "POST") {
    return res.status(405).end()
  }

  const { email, password, role } = req.body as SignUpRequestBody

  if (!email || !password || !role) {
    return res.status(400).json({ error: "Missing required fields" })
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, role },
    })
    res.status(201).json({ id: user.id, email: user.email, role: user.role })
  } catch (error) {
    res.status(400).json({ error: "User already exists or invalid data" })
  }
}
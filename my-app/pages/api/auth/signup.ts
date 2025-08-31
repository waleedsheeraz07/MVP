import type { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient, User, Prisma } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

type Role = "buyer" | "seller"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const logs: string[] = []

  if (req.method !== "POST") {
    logs.push("Invalid method: " + req.method)
    return res.status(405).redirect(`/signup?error=Method+not+allowed`)
  }

  const { email, password, role } = req.body as { email?: string; password?: string; role?: string }

  if (!email || !password || !role) {
    logs.push("Missing required fields")
    return res.redirect(`/signup?error=Missing+fields&email=${encodeURIComponent(email || "")}&role=${encodeURIComponent(role || "buyer")}`)
  }

  if (role !== "buyer" && role !== "seller") {
    logs.push("Invalid role")
    return res.redirect(`/signup?error=Invalid+role&email=${encodeURIComponent(email)}&role=buyer`)
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    const user: User = await prisma.user.create({
      data: { email, password: hashedPassword, role: role as Role },
    })

    logs.push(`User created with ID: ${user.id}`)
    logs.push("Signup successful! Please log in.")

    return res.redirect(`/signup?logs=${encodeURIComponent(logs.join("|"))}`)
  } catch (err: unknown) {
    let errorMessage = "Internal server error"
    if ((err as Prisma.PrismaClientKnownRequestError).code === "P2002") {
      errorMessage = "Email already exists"
    }
    logs.push(`Signup failed: ${errorMessage}`)
    return res.redirect(`/signup?error=${encodeURIComponent(errorMessage)}&email=${encodeURIComponent(email)}&role=${encodeURIComponent(role)}`)
  }
}
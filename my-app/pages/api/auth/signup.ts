import { NextApiRequest, NextApiResponse } from "next"
import { PrismaClient, User } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()
type Role = "buyer" | "seller"

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const logs: string[] = []

  if (req.method !== "POST") {
    logs.push("Invalid method: " + req.method)
    return res.redirect(
      `/signup?error=Method not allowed&logs=${encodeURIComponent(logs.join("|"))}`
    )
  }

  const { email, password, role } = req.body as { email?: string; password?: string; role?: string }

  logs.push("Received signup request")

  if (!email || !password || !role) {
    logs.push("Missing required fields")
    return res.redirect(
      `/signup?error=Missing required fields&logs=${encodeURIComponent(logs.join("|"))}&email=${email || ""}&role=${role || ""}`
    )
  }

  if (role !== "buyer" && role !== "seller") {
    logs.push("Invalid role")
    return res.redirect(
      `/signup?error=Invalid role&logs=${encodeURIComponent(logs.join("|"))}&email=${email}&role=${role}`
    )
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10)
    logs.push("Password hashed")

    const user: User = await prisma.user.create({
      data: { email, password: hashedPassword, role },
    })
    logs.push("User created: " + user.id)

    // redirect to login on success
    return res.redirect("/login")
  } catch (err: any) {
    logs.push("Signup error: " + err.message)
    if (err.code === "P2002") logs.push("Email already exists")

    return res.redirect(
      `/signup?error=${encodeURIComponent(err.code === "P2002" ? "Email already exists" : "Internal server error")}&logs=${encodeURIComponent(
        logs.join("|")
      )}&email=${email}&role=${role}`
    )
  }
}
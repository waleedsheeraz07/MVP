import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end()

  const { email, password, role } = req.body
  const hashedPassword = await bcrypt.hash(password, 10)

  try {
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, role },
    })
    res.status(201).json({ id: user.id, email: user.email, role: user.role })
  } catch (err) {
    res.status(400).json({ error: "User already exists or invalid data" })
  }
}
import NextAuth, { AuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaClient, User as PrismaUser } from "@prisma/client"
import bcrypt from "bcryptjs"
import { JWT } from "next-auth/jwt"

const prisma = new PrismaClient()

interface MySession {
  user: {
    id: string
    email: string
    role: string
  }
}

interface MyToken extends JWT {
  role?: string
  id?: string
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password")
        }

        const user: PrismaUser | null = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) throw new Error("No user found")

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) throw new Error("Invalid password")

        return { id: user.id, email: user.email, role: user.role }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const t = token as MyToken
      if (user) {
        t.role = (user as any).role
        t.id = (user as any).id
      }
      return t
    },
    async session({ session, token }) {
      const s = session as unknown as MySession
      const t = token as MyToken
      s.user = {
        id: t.id || "",
        email: s.user.email || "",
        role: t.role || "buyer",
      }
      return s as any
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET || "supersecret",
}

export default NextAuth(authOptions)
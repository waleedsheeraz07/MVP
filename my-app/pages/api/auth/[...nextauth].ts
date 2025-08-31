import NextAuth, { AuthOptions, Session, User } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaClient, User as PrismaUser } from "@prisma/client"
import bcrypt from "bcryptjs"
import { JWT } from "next-auth/jwt"

const prisma = new PrismaClient()

// Custom types
interface MyToken extends JWT {
  id: string
  role: string
}

interface MySession extends Session {
  user: {
    id: string
    email: string
    role: string
  }
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password")
        }

        const user: PrismaUser | null = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) throw new Error("No user found")

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) throw new Error("Invalid password")

        return {
          id: user.id,
          email: user.email,
          role: user.role,
        } as User
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const t = token as MyToken
      if (user) {
        t.id = user.id
        t.role = user.role
      }
      return t
    },
    async session({ session, token }) {
      const s = session as MySession
      const t = token as MyToken
      s.user = {
        id: t.id,
        email: session.user?.email || "",
        role: t.role,
      }
      return s
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
}

export default NextAuth(authOptions)
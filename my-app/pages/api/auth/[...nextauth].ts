// pages/api/[...nextAuth].ts:
import NextAuth, { type AuthOptions, type User } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { compare } from "bcryptjs";

const prisma = new PrismaClient();

interface JWT {
  id: string;
  role: string;
  name: string;
  email?: string;
}

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) throw new Error("Invalid email or password");

        if (user.role === "BLOCKED" || user.role === "DELETED") {
          throw new Error("Your account is blocked or deleted");
        }

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) throw new Error("Invalid email or password");

        return {
          id: user.id,
          name: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email.split("@")[0],
          email: user.email,
          role: user.role,
        } as User;
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      // On login, attach user info
      if (user) {
        token.id = (user as any).id;
        token.name = (user as any).name;
        token.role = (user as any).role;
        token.email = (user as any).email;
      }

      // Always return a valid JWT
      return token as JWT;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          id: token.id,
          name: token.name,
          role: token.role,
          email: token.email || "",
        };
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);
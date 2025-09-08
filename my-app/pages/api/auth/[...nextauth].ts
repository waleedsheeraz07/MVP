// pages/api/[...nextAuth].ts:
import NextAuth, { type AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { compare } from "bcryptjs";

const prisma = new PrismaClient();

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

        if (!user) {
          throw new Error("Invalid email or password");
        }

        // 🚫 Block login if role is BLOCKED or DELETED
        if (user.role === "BLOCKED" || user.role === "DELETED") {
          throw new Error("Your account has been disabled. Please contact support.");
        }

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        // Build a safe name
        const name = [user.firstName, user.lastName].filter(Boolean).join(" ");
        return {
          id: user.id,
          name: name || user.email.split("@")[0], // fallback to email if no name
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
      }

      // 🚫 In case the role changed after login, enforce logout
      if (token.role === "BLOCKED" || token.role === "DELETED") {
        return {}; // invalidate token
      }

      return token;
    },
    async session({ session, token }) {
      if (token && token.id) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.name = token.name as string;
      } else {
        // 🚫 Ensure blocked/deleted users have no session
        session.user = null as any;
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);
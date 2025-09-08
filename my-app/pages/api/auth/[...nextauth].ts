// pages/api/auth/[...nextauth].ts
// pages/api/auth/[...nextauth].ts
import NextAuth, { type AuthOptions, type Session } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { compare } from "bcryptjs";
import { JWT as NextAuthJWT } from "next-auth/jwt";

const prisma = new PrismaClient();

// Extend JWT type
interface ExtendedJWT extends NextAuthJWT {
  id: string;
  role: string;
  name: string;
  email: string | null;
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

        if (!user) {
          throw new Error("Invalid email or password");
        }

        if (user.role === "BLOCKED" || user.role === "DELETED") {
          throw new Error("Your account is not active");
        }

        const isValid = await compare(credentials.password, user.password);
        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        const name = [user.firstName, user.lastName].filter(Boolean).join(" ");

        return {
          id: user.id,
          name: name || user.email.split("@")[0],
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
    async jwt({ token, user }): Promise<ExtendedJWT> {
      // On login
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.name = user.name;
        token.email = user.email ?? null; // ✅ force string | null
      }

      // Dynamically check role
      if (token.id) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.id } });
        if (!dbUser || dbUser.role === "BLOCKED" || dbUser.role === "DELETED") {
          throw new Error("Your account is no longer active");
        }
        token.role = dbUser.role;
        token.email = dbUser.email ?? null; // ✅ keep consistent with type
      }

      return token;
    },
    async session({ session, token }): Promise<Session> {
      if (token) {
        session.user = {
          id: token.id,
          name: token.name,
          email: token.email ?? "", // ✅ ensures string
          role: token.role,
        };
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);
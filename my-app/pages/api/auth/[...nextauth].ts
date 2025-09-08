// pages/api/[...nextAuth].ts:
import NextAuth, { type AuthOptions, type User as NextAuthUser } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient, User as PrismaUser } from "@prisma/client";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { compare } from "bcryptjs";

const prisma = new PrismaClient();

interface JWT {
  id: string;
  role: string;
  name: string;
  email?: string;
}

// Type for user object returned by authorize
interface AuthUser extends NextAuthUser {
  id: string;
  role: string;
  name: string;
  email: string;
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

        const user: PrismaUser | null = await prisma.user.findUnique({
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
        } as AuthUser;
      },
    }),
  ],
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, user }: { token: JWT; user?: AuthUser }) {
      // Attach user info on login
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.role = user.role;
        token.email = user.email;
      }

      return token;
    },
    async session({ session, token }: { session: any; token: JWT }) {
      if (token) {
        session.user = {
          id: token.id,
          name: token.name,
          role: token.role,
          email: token.email ?? "",
        };
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);
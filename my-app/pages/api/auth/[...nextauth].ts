// pages/api/[...nextAuth].ts:
import NextAuth, { type AuthOptions, type Session, type User as NextAuthUser, type JWT } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaClient } from "@prisma/client";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { compare } from "bcryptjs";

const prisma = new PrismaClient();

interface ExtendedJWT extends JWT {
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

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user) {
          throw new Error("Invalid email or password");
        }

        // Prevent login if user is BLOCKED or DELETED
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
        token.email = user.email;
      }

      // Every request: check user role dynamically
      if (token.id) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.id } });
        if (!dbUser || dbUser.role === "BLOCKED" || dbUser.role === "DELETED") {
          throw new Error("Your account is no longer active");
        }
        token.role = dbUser.role; // update role dynamically
      }

      return token;
    },
    async session({ session, token }): Promise<Session> {
      if (token) {
        session.user = {
          id: token.id,
          name: token.name,
          email: token.email ?? "",
          role: token.role,
        };
      }
      return session;
    },
  },
};

export default NextAuth(authOptions);
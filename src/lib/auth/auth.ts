import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/db/prisma";
import authConfig from "./auth.config";
import type { UserRole } from "@/generated/prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role: UserRole;
    };
  }

  interface User {
    role?: UserRole;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  ...authConfig,
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      const allowedDomain = process.env.ALLOWED_DOMAIN;
      if (!allowedDomain) return true;

      const email = user.email;
      if (!email) return false;

      return email.endsWith(`@${allowedDomain}`);
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role ?? "student";
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = (token.role as UserRole) ?? "student";
      }
      return session;
    },
  },
});

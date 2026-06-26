import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { checkRateLimit, recordFailedAttempt, clearAttempts } from "./rateLimit";

function getClientKey(req: { headers?: Record<string, string | string[] | undefined> }): string {
  const forwarded = req.headers?.["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) {
    return forwarded.split(",")[0].trim();
  }
  return "unknown";
}

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  pages: {
    signIn: "/admin/login",
    error: "/admin/login",
  },
  providers: [
    CredentialsProvider({
      name: "Admin",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        const key = getClientKey(req as { headers?: Record<string, string | string[] | undefined> });
        const rl = checkRateLimit(key);
        if (!rl.allowed) {
          throw new Error("TooManyAttempts");
        }

        const username = credentials?.username?.trim();
        const password = credentials?.password ?? "";

        const adminUsername = process.env.ADMIN_USERNAME ?? "";
        const adminHash = process.env.ADMIN_PASSWORD_HASH ?? "";

        if (!username || !password || !adminUsername || !adminHash) {
          recordFailedAttempt(key);
          return null;
        }

        // Constant-shape comparison: always run bcrypt.compare even if the
        // username doesn't match, so failed attempts take a consistent
        // amount of time regardless of which field was wrong (mitigates
        // username-enumeration via timing).
        const usernameMatches = username === adminUsername;
        const passwordMatches = await bcrypt.compare(password, adminHash);

        if (!usernameMatches || !passwordMatches) {
          recordFailedAttempt(key);
          return null;
        }

        clearAttempts(key);
        return { id: "admin", name: "Admin", email: adminUsername };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = "admin";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role = token.role as string | undefined;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

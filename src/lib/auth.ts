import NextAuth, { NextAuthConfig } from "next-auth"
import Credentials from "next-auth/providers/credentials"
import Google from "next-auth/providers/google"
import Facebook from "next-auth/providers/facebook"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const loginSchema = z.object({
  identifier: z.string().min(3), // email or phone
  password: z.string().min(4)
})

export const authConfig: NextAuthConfig = {
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true
    }),
    Facebook({
      clientId: process.env.FACEBOOK_CLIENT_ID!,
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET!,
      allowDangerousEmailAccountLinking: true
    }),
    Credentials({
      name: "Email/Phone + Password",
      credentials: {
        identifier: { label: "Email or Phone", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(creds) {
        const parsed = loginSchema.safeParse(creds)
        if (!parsed.success) return null
        const { identifier, password } = parsed.data
        const where = identifier.includes("@")
          ? { email: identifier }
          : { phone: identifier }
        const user = await prisma.user.findUnique({ where })
        if (!user || !user.passwordHash) return null
        const ok = await bcrypt.compare(password, user.passwordHash)
        if (!ok) return null
        return {
          id: user.id,
          name: user.name ?? null,
          email: user.email ?? null,
          image: user.image ?? null,
          role: user.role
        } as any
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account, profile }) {
      if (user) token.role = (user as any).role || "USER"
      return token
    },
    async session({ session, token }) {
      if (session.user) (session.user as any).role = token.role
      return session
    },
    async signIn({ user, account, profile }) {
      // Auto-provision OAuth users
      if (account && (account.provider === "google" || account.provider === "facebook")) {
        const existing = await prisma.user.findUnique({ where: { email: user.email! } })
        if (!existing) {
          await prisma.user.create({
            data: { email: user.email!, name: user.name ?? "", image: user.image ?? "" }
          })
        }
      }
      return true
    }
  },
  pages: {
    signIn: "/login"
  }
}

export const { handlers: authHandlers, auth } = NextAuth(authConfig)

import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

// Stable demo user IDs (UUID format)
export const DEMO_IDS = {
  buyer: "11111111-1111-1111-1111-111111111111",
  seller: "22222222-2222-2222-2222-222222222222",
  admin: "33333333-3333-3333-3333-333333333333",
}

// Temporary bridge for any old sessions still carrying "1","2","3"
export function resolveDemoUserId(rawId: string | undefined): string {
  if (!rawId) return DEMO_IDS.buyer
  if (rawId === "1" || rawId === DEMO_IDS.buyer) return DEMO_IDS.buyer
  if (rawId === "2" || rawId === DEMO_IDS.seller) return DEMO_IDS.seller
  if (rawId === "3" || rawId === DEMO_IDS.admin) return DEMO_IDS.admin
  return rawId
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        })

        if (!user || !user.password) return null

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) return null

        // Return the shape NextAuth expects
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        }
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  session: {
    strategy: "jwt" as const,
  },

  callbacks: {
    async signIn({ user, account, profile }: any) {
      // Handle Google users: ensure they exist in our Prisma DB with a real UUID + role
      if (account?.provider === "google" && user?.email) {
        const existing = await prisma.user.findUnique({
          where: { email: user.email.toLowerCase() },
        })

        if (!existing) {
          // New Google user → create with buyer role by default
          const newUser = await prisma.user.create({
            data: {
              name: user.name || profile?.name || "Google User",
              email: user.email.toLowerCase(),
              role: "buyer",
              // No password for OAuth users
            },
          })
          user.id = newUser.id
          user.role = newUser.role
        } else {
          user.id = existing.id
          user.role = existing.role
        }
      }
      return true
    },

    async jwt({ token, user, account }: any) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role || "buyer"
      }

      // On subsequent requests, make sure we have fresh role from DB (in case it changed)
      if (token.id && !user) {
        const dbUser = await prisma.user.findUnique({ where: { id: token.id as string } })
        if (dbUser) {
          token.role = dbUser.role
        }
      }

      return token
    },

    async session({ session, token }: any) {
      if (session.user) {
        (session.user as any).id = token.id as string
        (session.user as any).role = token.role as string
      }
      return session
    },
  },

  pages: {
    signIn: "/login",
  },
}

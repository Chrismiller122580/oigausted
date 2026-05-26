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

/** Type-safe admin check (works with both JWT session.user and token shapes) */
export function isAdmin(userOrSession: any): boolean {
  const role = userOrSession?.role ?? (userOrSession as any)?.user?.role
  return role === 'admin'
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
        if (!credentials?.email || !credentials?.password) {
          console.warn('[auth] Missing email or password in credentials')
          return null
        }

        try {
          const user = await prisma.user.findUnique({
            where: { email: credentials.email.toLowerCase() },
          })

          if (!user) {
            console.warn('[auth] No user found for email:', credentials.email.toLowerCase())
            return null
          }
          if (!user.password) {
            console.warn('[auth] User has no password set (OAuth-only account?):', user.email)
            return null
          }

          const isValid = await bcrypt.compare(credentials.password, user.password)
          if (!isValid) {
            console.warn('[auth] Password mismatch for:', user.email)
            return null
          }

          // Return the shape NextAuth expects
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          }
        } catch (err) {
          console.error('[auth] Unexpected error in Credentials authorize:', err)
          return null
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

        // Pull fresh data from DB so profile updates are reflected immediately
        if (token.id) {
          const dbUser = await prisma.user.findUnique({ 
            where: { id: token.id as string },
            select: {
              name: true,
              image: true,
              profilePicture: true,
              businessName: true,
              bio: true,
              phone: true,
              whatsapp: true,
              instagram: true,
              facebook: true,
              city: true,
              rating: true,
              reviewCount: true,
            }
          })
          if (dbUser) {
            (session.user as any).name = dbUser.name
            ;(session.user as any).image = dbUser.image || dbUser.profilePicture
            ;(session.user as any).profilePicture = dbUser.profilePicture
            ;(session.user as any).businessName = dbUser.businessName
            ;(session.user as any).bio = dbUser.bio
            ;(session.user as any).phone = dbUser.phone
            ;(session.user as any).whatsapp = dbUser.whatsapp
            ;(session.user as any).instagram = dbUser.instagram
            ;(session.user as any).facebook = dbUser.facebook
            ;(session.user as any).city = dbUser.city
            ;(session.user as any).rating = dbUser.rating
            ;(session.user as any).reviewCount = dbUser.reviewCount
          }
        }
      }
      return session
    },
  },

  pages: {
    signIn: "/login",
  },
}

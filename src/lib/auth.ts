import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"

// Stable demo user IDs (UUID format) - LEGACY for old sessions/demo only.
// In production, all users should use real UUIDs from Prisma.
export const DEMO_IDS = {
  buyer: "11111111-1111-1111-1111-111111111111",
  seller: "22222222-2222-2222-2222-222222222222",
  admin: "33333333-3333-3333-3333-333333333333",
}

/** Temporary bridge for any old sessions still carrying "1","2","3" (demo compat).
 *  TODO: Remove once all sessions use real UUIDs.
 */
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

export function getSessionRole(session: any): string {
  return (session?.user as any)?.role || 'buyer'
}

export function isSeller(session: any): boolean {
  const role = getSessionRole(session)
  return role === 'seller' || role === 'admin'
}

const providers: any[] = [
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
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            password: true,
          }
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
]

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  providers.push(
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })
  )
}

export const authOptions = {
  providers,

  session: {
    strategy: "jwt" as const,
  },

  callbacks: {
    async signIn({ user, account, profile }: any) {
      // Handle Google users: ensure they exist in our Prisma DB with a real UUID + role
      if (account?.provider === "google" && user?.email) {
        const email = user.email.toLowerCase()
        const existing = await prisma.user.findUnique({
          where: { email },
          select: { id: true, role: true }
        })

        // Support promoting specific real Gmail accounts to admin automatically
        const adminEmails = (process.env.ADMIN_EMAILS || '')
          .split(',')
          .map((e) => e.trim().toLowerCase())
          .filter(Boolean)

        const shouldBeAdmin = adminEmails.includes(email)

        if (!existing) {
          const newUser = await prisma.user.create({
            data: {
              name: user.name || profile?.name || "Google User",
              email,
              role: shouldBeAdmin ? 'admin' : 'buyer',
            },
          })
          user.id = newUser.id
          user.role = newUser.role
        } else {
          // If this Gmail is listed as admin, upgrade the role on login
          const finalRole = shouldBeAdmin ? 'admin' : existing.role
          if (finalRole !== existing.role) {
            const updated = await prisma.user.update({
              where: { email },
              data: { role: finalRole },
            })
            user.role = updated.role
          } else {
            user.role = existing.role
          }
          user.id = existing.id
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
      // Use explicit select to avoid breaking auth if other columns are temporarily missing in DB
      if (token.id && !user) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { role: true }
        })
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
              profilePicture: true,
              businessName: true,
              bio: true,
              phone: true,
              whatsapp: true,
              instagram: true,
              facebook: true,
              rating: true,
              reviewCount: true,
            }
          })
          if (dbUser) {
            (session.user as any).name = dbUser.name
            ;(session.user as any).image = dbUser.profilePicture
            ;(session.user as any).profilePicture = dbUser.profilePicture
            ;(session.user as any).businessName = dbUser.businessName
            ;(session.user as any).bio = dbUser.bio
            ;(session.user as any).phone = dbUser.phone
            ;(session.user as any).whatsapp = dbUser.whatsapp
            ;(session.user as any).instagram = dbUser.instagram
            ;(session.user as any).facebook = dbUser.facebook
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
    error: "/login/error",   // Use our nice error page instead of the default /api/auth/error
  },
}

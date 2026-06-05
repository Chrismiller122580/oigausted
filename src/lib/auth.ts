import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"
import { devLog } from './utils'

// Demo IDs removed - legacy support for old "1","2","3" sessions no longer needed.
// All users now use real Prisma UUIDs.

/** Type-safe admin check (works with both JWT session.user and token shapes) */
export function isAdmin(userOrSession: any): boolean {
  const role = userOrSession?.role ?? userOrSession?.user?.role
  return role === 'admin'
}

export function getSessionRole(session: any): string {
  return session?.user?.role || 'buyer'
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
        devLog('[auth] Missing email or password in credentials')
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
          devLog('[auth] No user found for email:', credentials.email.toLowerCase())
          return null
        }
        if (!user.password) {
          devLog('[auth] User has no password set (OAuth-only account?):', user.email)
          return null
        }

        const isValid = await bcrypt.compare(credentials.password, user.password)
        if (!isValid) {
          devLog('[auth] Password mismatch for:', user.email)
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

// @ts-ignore - next-auth types in this env
export { getServerSession } from "next-auth";

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
        // Populate profile fields at signin time only (avoids per-request DB in session)
        // If profile edited later, client can refresh session or re-login for instant reflect
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id as string },
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
            referredById: true,
          }
        })
        if (dbUser) {
          const t = token as any
          t.name = dbUser.name
          t.profilePicture = dbUser.profilePicture
          t.businessName = dbUser.businessName
          t.bio = dbUser.bio
          t.phone = dbUser.phone
          t.whatsapp = dbUser.whatsapp
          t.instagram = dbUser.instagram
          t.facebook = dbUser.facebook
          t.rating = dbUser.rating
          t.reviewCount = dbUser.reviewCount
          t.referredById = dbUser.referredById
        }
      }

      // No per-request role/profile refetch to reduce DB load on every getServerSession (role changes require re-login or explicit session update)
      return token
    },

    async session({ session, token }: any) {
      if (session.user) {
        const su = session.user as any
        const t = token as any
        su.id = t.id as string
        su.role = t.role as string

        // Profile fields come from token (populated at signin/jwt to avoid N+1 DB per session)
        if (t.name) su.name = t.name
        if (t.profilePicture != null) {
          su.image = t.profilePicture
          su.profilePicture = t.profilePicture
        }
        su.businessName = t.businessName
        su.bio = t.bio
        su.phone = t.phone
        su.whatsapp = t.whatsapp
        su.instagram = t.instagram
        su.facebook = t.facebook
        su.rating = t.rating ?? 0
        su.reviewCount = t.reviewCount ?? 0
        su.referredById = t.referredById ?? null
      }
      return session
    },
  },

  pages: {
    signIn: "/login",
    error: "/login/error",   // Use our nice error page instead of the default /api/auth/error
  },
}

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

        try {
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
        } catch (err) {
          // DB unreachable or other transient error — still allow the OAuth sign-in
          // (the provider already authenticated the user). Session will be minimal until DB recovers.
          devLog('[auth] signIn Google DB operation failed (non-fatal, allowing sign-in):', err)
          // user.id etc. may be missing, but NextAuth will still create a session from the provider user
        }
      }
      return true
    },

    async jwt({ token, user, account, trigger, session }: any) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role || "buyer"
        // Populate profile fields at signin time only (avoids per-request DB in session)
        // If profile edited later, client can refresh session or re-login for instant reflect
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id as string },
            select: {
              name: true,
              tagline: true,
              profilePicture: true,
              businessName: true,
              bio: true,
              phone: true,
              whatsapp: true,
              instagram: true,
              facebook: true,
              city: true,
              latitude: true,
              longitude: true,
              serviceRadiusKm: true,
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
            t.city = dbUser.city
            t.latitude = dbUser.latitude
            t.longitude = dbUser.longitude
            t.serviceRadiusKm = dbUser.serviceRadiusKm
            t.rating = dbUser.rating
            t.reviewCount = dbUser.reviewCount
            t.referredById = dbUser.referredById
          }
        } catch (err) {
          // Non-fatal: allow basic session from the provider user object
          devLog('[auth] jwt DB enrichment failed (non-fatal):', err)
        }
      }

      // Support client-side session.update({ ... }) calls from profile editors
      // This lets saves reflect immediately without requiring a full re-login or page reload.
      if (trigger === 'update' && session) {
        const t = token as any
        if (session.name !== undefined) t.name = session.name
        if (session.tagline !== undefined) t.tagline = session.tagline
        const pic = session.profilePicture ?? session.image
        if (pic !== undefined) {
          t.profilePicture = pic
        }
        if (session.businessName !== undefined) t.businessName = session.businessName
        if (session.bio !== undefined) t.bio = session.bio
        if (session.phone !== undefined) t.phone = session.phone
        if (session.whatsapp !== undefined) t.whatsapp = session.whatsapp
        if (session.instagram !== undefined) t.instagram = session.instagram
        if (session.facebook !== undefined) t.facebook = session.facebook
        // city can come as 'city' (main profile) or 'location' (seller profile form)
        if (session.city !== undefined) t.city = session.city
        else if (session.location !== undefined) t.city = session.location
        if (session.latitude !== undefined) t.latitude = session.latitude
        if (session.longitude !== undefined) t.longitude = session.longitude
        if (session.serviceRadiusKm !== undefined) t.serviceRadiusKm = session.serviceRadiusKm
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
        if (t.tagline !== undefined) su.tagline = t.tagline
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
        su.city = t.city
        su.latitude = t.latitude
        su.longitude = t.longitude
        su.serviceRadiusKm = t.serviceRadiusKm
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

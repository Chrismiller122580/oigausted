import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { prisma } from "./prisma"
import bcrypt from "bcryptjs"
import { devLog } from './utils'
import { verifyImpersonationToken } from './impersonation'
import type { NextAuthOptions, Session } from 'next-auth'
import type { JWT } from 'next-auth/jwt'
import type { UserRole } from './session'

type AuthProvider = ReturnType<typeof CredentialsProvider> | ReturnType<typeof GoogleProvider>

/** Custom fields passed via session.update() from profile editors / impersonation UI */
type SessionUpdatePayload = Session & {
  role?: UserRole
  name?: string | null
  tagline?: string | null
  profilePicture?: string | null
  image?: string | null
  coverImageUrl?: string | null
  businessName?: string | null
  bio?: string | null
  phone?: string | null
  whatsapp?: string | null
  instagram?: string | null
  facebook?: string | null
  city?: string | null
  location?: string | null
  latitude?: number | null
  longitude?: number | null
  serviceRadiusKm?: number | null
  impersonationToken?: string
  stopImpersonation?: boolean
}

declare module 'next-auth/jwt' {
  interface JWT {
    tagline?: string | null
    coverImageUrl?: string | null
    businessName?: string | null
    bio?: string | null
    phone?: string | null
    whatsapp?: string | null
    instagram?: string | null
    facebook?: string | null
    city?: string | null
    latitude?: number | null
    longitude?: number | null
    serviceRadiusKm?: number | null
    rating?: number
    reviewCount?: number
  }
}

type ExtendedSessionUser = Session['user'] & {
  bio?: string | null
  latitude?: number | null
  longitude?: number | null
  serviceRadiusKm?: number | null
}

// Demo IDs removed - legacy support for old "1","2","3" sessions no longer needed.
// All users now use real Prisma UUIDs.

type SessionLike = Session | { role?: UserRole; user?: { role?: UserRole } } | null | undefined

/** Type-safe admin check (works with both JWT session.user and token shapes) */
export function isAdmin(userOrSession: SessionLike): boolean {
  const role = (userOrSession as { role?: UserRole })?.role ?? userOrSession?.user?.role
  return role === 'admin'
}

export function getSessionRole(session: SessionLike): UserRole {
  const role = session?.user?.role
  if (role === 'admin' || role === 'seller' || role === 'buyer') return role
  return 'buyer'
}

export function isSeller(session: SessionLike): boolean {
  const role = getSessionRole(session)
  return role === 'seller' || role === 'admin'
}

const providers: AuthProvider[] = [
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
            isActive: true,
          }
        })

        if (!user) {
          devLog('[auth] No user found for email:', credentials.email.toLowerCase())
          return null
        }
        if (user.isActive === false) {
          devLog('[auth] User account is deactivated:', user.email)
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

export { getServerSession } from "next-auth";

export const authOptions: NextAuthOptions = {
  providers,

  session: {
    strategy: "jwt" as const,
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle Google users: ensure they exist in our Prisma DB with a real UUID + role
      if (account?.provider === "google" && user?.email) {
        const email = user.email.toLowerCase()

        try {
          const existing = await prisma.user.findUnique({
            where: { email },
            select: { id: true, role: true, isActive: true }
          })

          if (existing?.isActive === false) {
            devLog('[auth] Google sign-in blocked for deactivated user:', email)
            return false
          }

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

            import('@/lib/admin-notifications')
              .then(({ notifyAdminsNewSignup }) =>
                notifyAdminsNewSignup({
                  name: newUser.name,
                  email: newUser.email,
                  role: newUser.role,
                  viaGoogle: true,
                })
              )
              .catch((e) => devLog('[auth] Admin signup email failed (non-fatal):', e))
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

    async jwt({ token, user, trigger, session }) {
      const t = token as JWT
      if (user) {
        t.id = user.id
        t.role = user.role || "buyer"
        // Populate profile fields at signin time only (avoids per-request DB in session)
        // If profile edited later, client can refresh session or re-login for instant reflect
        try {
          const dbUser = await prisma.user.findUnique({
            where: { id: user.id as string },
            select: {
              name: true,
              tagline: true,
              profilePicture: true,
              coverImageUrl: true,
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
            t.name = dbUser.name
            t.tagline = dbUser.tagline
            t.profilePicture = dbUser.profilePicture
            t.coverImageUrl = dbUser.coverImageUrl
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
        const update = session as SessionUpdatePayload
        if (update.role !== undefined) t.role = update.role
        if (update.name !== undefined) t.name = update.name
        if (update.tagline !== undefined) t.tagline = update.tagline
        const pic = update.profilePicture ?? update.image
        if (pic !== undefined) {
          t.profilePicture = pic
        }
        if (update.coverImageUrl !== undefined) t.coverImageUrl = update.coverImageUrl
        if (update.businessName !== undefined) t.businessName = update.businessName
        if (update.bio !== undefined) t.bio = update.bio
        if (update.phone !== undefined) t.phone = update.phone
        if (update.whatsapp !== undefined) t.whatsapp = update.whatsapp
        if (update.instagram !== undefined) t.instagram = update.instagram
        if (update.facebook !== undefined) t.facebook = update.facebook
        // city can come as 'city' (main profile) or 'location' (seller profile form)
        if (update.city !== undefined) t.city = update.city
        else if (update.location !== undefined) t.city = update.location
        if (update.latitude !== undefined) t.latitude = update.latitude
        if (update.longitude !== undefined) t.longitude = update.longitude
        if (update.serviceRadiusKm !== undefined) t.serviceRadiusKm = update.serviceRadiusKm

        // === Impersonation support (admin only, requires signed token from /api/admin/impersonate) ===
        if (update.impersonationToken) {
          const verified = verifyImpersonationToken(update.impersonationToken)
          if (verified && verified.adminId === t.id) {
            try {
              const admin = await prisma.user.findUnique({
                where: { id: verified.adminId },
                select: { role: true },
              })
              if (admin?.role === 'admin') {
                t.impersonatorId = verified.adminId
                t.impersonatedUserId = verified.targetUserId
              }
            } catch (e) {
              devLog('[auth] Impersonation token admin check failed', e)
            }
          }
        }

        if (update.stopImpersonation) {
          const realAdminId = t.impersonatorId || t.id
          // Clear impersonation flags
          delete t.impersonatedUserId
          delete t.impersonatorId
          // Re-load the real admin's identity so the session becomes the admin again
          if (realAdminId) {
            try {
              const realAdmin = await prisma.user.findUnique({
                where: { id: realAdminId },
                select: {
                  id: true, name: true, role: true, email: true,
                  tagline: true, profilePicture: true, businessName: true,
                  bio: true, phone: true, whatsapp: true, instagram: true, facebook: true,
                  city: true, latitude: true, longitude: true, serviceRadiusKm: true,
                  rating: true, reviewCount: true, referredById: true,
                }
              })
              if (realAdmin) {
                t.id = realAdmin.id
                t.role = realAdmin.role || 'admin'
                t.name = realAdmin.name
                t.email = realAdmin.email
                t.tagline = realAdmin.tagline
                t.profilePicture = realAdmin.profilePicture
                t.businessName = realAdmin.businessName
                t.bio = realAdmin.bio
                t.phone = realAdmin.phone
                t.whatsapp = realAdmin.whatsapp
                t.instagram = realAdmin.instagram
                t.facebook = realAdmin.facebook
                t.city = realAdmin.city
                t.latitude = realAdmin.latitude
                t.longitude = realAdmin.longitude
                t.serviceRadiusKm = realAdmin.serviceRadiusKm
                t.rating = realAdmin.rating ?? 0
                t.reviewCount = realAdmin.reviewCount ?? 0
                t.referredById = realAdmin.referredById ?? null
              }
            } catch (e) {
              devLog('[auth] Failed to restore admin after stopping impersonation', e)
            }
          }
        }
      }

      // === Impersonation override (applies on every token resolution / refresh) ===
      // If the token carries an impersonatedUserId (set via update or persisted in JWT),
      // we override the visible identity (id, role, profile fields) with the target's data.
      // The original admin id is kept in impersonatorId so we can stop later.
      if (t.impersonatedUserId && t.impersonatorId) {
        // Re-verify admin on every token refresh — revoke if impersonator is no longer admin
        try {
          const impersonator = await prisma.user.findUnique({
            where: { id: t.impersonatorId },
            select: { role: true },
          })
          if (impersonator?.role !== 'admin') {
            delete t.impersonatedUserId
            delete t.impersonatorId
            delete t.impersonating
            return token
          }
        } catch (e) {
          devLog('[auth] Impersonation admin re-check failed (non-fatal)', e)
        }
      }

      if (t.impersonatedUserId && t.impersonatorId) {
        try {
          const target = await prisma.user.findUnique({
            where: { id: t.impersonatedUserId },
            select: {
              id: true,
              name: true,
              role: true,
              email: true,
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
          if (target) {
            // Save who the real admin is (if not already recorded)
            if (!t.impersonatorId) {
              t.impersonatorId = t.id
            }
            // Override visible session identity with the impersonated user
            t.id = target.id
            t.role = target.role || 'buyer'
            t.name = target.name
            t.email = target.email
            t.tagline = target.tagline
            t.profilePicture = target.profilePicture
            t.businessName = target.businessName
            t.bio = target.bio
            t.phone = target.phone
            t.whatsapp = target.whatsapp
            t.instagram = target.instagram
            t.facebook = target.facebook
            t.city = target.city
            t.latitude = target.latitude
            t.longitude = target.longitude
            t.serviceRadiusKm = target.serviceRadiusKm
            t.rating = target.rating ?? 0
            t.reviewCount = target.reviewCount ?? 0
            t.referredById = target.referredById ?? null
            t.impersonating = true
          }
        } catch (e) {
          devLog('[auth] Impersonation user load failed (non-fatal)', e)
        }
      }

      // No per-request role/profile refetch to reduce DB load on every getServerSession (role changes require re-login or explicit session update)
      return token
    },

    async session({ session, token }) {
      const t = token as JWT
      const effectiveUserId = t?.id as string | undefined

      if (effectiveUserId) {
        try {
          const activeUser = await prisma.user.findUnique({
            where: { id: effectiveUserId },
            select: { isActive: true },
          })
          if (activeUser?.isActive === false) {
            return { ...session, user: undefined, expired: true }
          }
        } catch (e) {
          devLog('[auth] session isActive check failed (non-fatal)', e)
        }
      }

      if (session.user) {
        const su = session.user as ExtendedSessionUser
        su.id = t.id as string
        su.role = (t.role === 'admin' || t.role === 'seller' || t.role === 'buyer' ? t.role : 'buyer')

        // Profile fields come from token (populated at signin/jwt to avoid N+1 DB per session)
        if (t.name) su.name = t.name
        if (t.tagline !== undefined) su.tagline = t.tagline
        if (t.profilePicture != null) {
          su.image = t.profilePicture
          su.profilePicture = t.profilePicture
        }
        su.coverImageUrl = t.coverImageUrl ?? null
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

        // Impersonation flags (visible to all UI so we can show the banner + stop button)
        su.impersonatorId = t.impersonatorId || null
        su.isImpersonating = !!t.impersonatorId
      }
      return session
    },
  },

  pages: {
    signIn: "/login",
    error: "/login/error",   // Use our nice error page instead of the default /api/auth/error
  },
}

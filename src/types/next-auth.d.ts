import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    expired?: boolean
    user: {
      id: string
      role?: "buyer" | "seller" | "admin"
      tagline?: string | null
      bio?: string | null
      businessName?: string | null
      profilePicture?: string | null
      latitude?: number | null
      longitude?: number | null
      serviceRadiusKm?: number | null
      coverImageUrl?: string | null
      rating?: number
      reviewCount?: number
      phone?: string | null
      city?: string | null
      whatsapp?: string | null
      instagram?: string | null
      facebook?: string | null
      isActive?: boolean
      referredById?: string | null
      customReferralRate?: number | null
      referralCode?: string | null
      slug?: string | null
      impersonatorId?: string | null
      isImpersonating?: boolean
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role?: "buyer" | "seller" | "admin"
    businessName?: string | null
    profilePicture?: string | null
    rating?: number
    reviewCount?: number
    whatsapp?: string | null
    isActive?: boolean
    referredById?: string | null
    customReferralRate?: number | null
    referralCode?: string | null
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role?: "buyer" | "seller" | "admin"
    name?: string | null
    email?: string | null
    profilePicture?: string | null
    referredById?: string | null
    customReferralRate?: number | null
    isActive?: boolean
    impersonatedUserId?: string
    impersonatorId?: string
    impersonating?: boolean
  }
}

export {}
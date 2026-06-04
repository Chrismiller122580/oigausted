import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      businessName?: string | null;
      profilePicture?: string | null;
      rating?: number;
      reviewCount?: number;
      phone?: string | null;
      city?: string | null;
    };
  }

  interface User {
    id: string;
    role?: string;
    businessName?: string | null;
    profilePicture?: string | null;
    rating?: number;
    reviewCount?: number;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role?: string;
    name?: string | null;
    email?: string | null;
    profilePicture?: string | null;
  }
}

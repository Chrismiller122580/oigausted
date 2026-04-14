import { PrismaAdapter } from "@auth/prisma-adapter"
import { prisma } from "@/lib/prisma"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (credentials?.email === "buyer@demo.com") return { id: "1", name: "Buyer Demo", email: "buyer@demo.com", role: "buyer" }
        if (credentials?.email === "seller@demo.com") return { id: "2", name: "Seller Demo", email: "seller@demo.com", role: "seller" }
        if (credentials?.email === "admin@demo.com") return { id: "3", name: "Admin", email: "admin@demo.com", role: "admin" }
        return null
      }
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],
  session: { 
    strategy: "jwt" as const 
  },
  callbacks: {
    async jwt({ token, user }: any) {
      if (user) {
        token.id = user.id
        token.role = (user as any).role || "buyer"
      }
      return token
    },
    async session({ session, token }: any) {
      if (session.user) {
        (session.user as any).id = token.id as string
        (session.user as any).role = token.role as string
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
  },
}

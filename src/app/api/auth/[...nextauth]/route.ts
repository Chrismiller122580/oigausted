import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// Extend the default session and JWT types to include role
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string
      role: string
    }
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string
  }
}

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const demoUsers = [
          { email: "chris@demo.com", password: "123", name: "Chris Miller", role: "admin" },
          { email: "buyer@demo.com", password: "123", name: "Juan Comprador", role: "buyer" },
          { email: "seller@demo.com", password: "123", name: "Maria Vendedora", role: "seller" },
        ]

        const user = demoUsers.find(u => 
          u.email === credentials.email && u.password === credentials.password
        )

        if (user) {
          // Upsert user in database
          await prisma.user.upsert({
            where: { email: user.email },
            update: { name: user.name, role: user.role },
            create: { 
              email: user.email, 
              name: user.name, 
              role: user.role 
            }
          })

          return {
            id: user.email,
            email: user.email,
            name: user.name,
            role: user.role,
          }
        }

        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role
      }
      return session
    }
  },
  pages: {
    signIn: "/login",
  },
})

export { handler as GET, handler as POST }

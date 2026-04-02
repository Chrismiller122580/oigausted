import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const email = credentials.email.toLowerCase().trim()
        const password = credentials.password.trim()

        const demoUsers = [
          { id: "1", name: "Chris Buyer", email: "buyer@demo.com", password: "123", role: "buyer" },
          { id: "2", name: "Ana Seller", email: "seller@demo.com", password: "123", role: "seller" },
          { id: "3", name: "Admin", email: "admin@demo.com", password: "123", role: "admin" },
          { id: "4", name: "Chris Miller", email: "chris@demo.com", password: "123", role: "admin" },
        ]

        const user = demoUsers.find(u => u.email === email && u.password === password)

        if (user) {
          console.log(`✅ Login successful: ${user.email} as ${user.role}`)
          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
          }
        }

        console.log(`❌ Login failed for: ${email}`)
        return null
      }
    })
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.role = (user as any).role
      return token
    },
    async session({ session, token }) {
      if (token.role) (session.user as any).role = token.role
      return session
    },
  },
})

export { handler as GET, handler as POST }

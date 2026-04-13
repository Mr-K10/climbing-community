import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
          const res = await fetch(`${apiBase}/api/v1/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          if (res.ok) {
            const data = await res.json()
            return {
              id: data.data.user.id,
              email: data.data.user.email,
              name: data.data.user.name,
              accessToken: data.data.access_token,
              onboarding_completed: data.data.user.onboarding_completed
            }
          }
          return null
        } catch (error) {
          console.error("Auth error:", error)
          return null
        }
      }
    }),
  ],
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (trigger === "update") {
        if (session?.user) {
          token.user = { ...(token.user as any), ...session.user }
        }
        if (session?.action === "refresh" && token.accessToken) {
          try {
            const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
            const res = await fetch(`${apiBase}/api/v1/auth/refresh`, {
              headers: { "Authorization": `Bearer ${token.accessToken}` },
            })
            if (res.ok) {
              const data = await res.json()
              token.accessToken = data.data.access_token
              token.user = data.data.user
            }
          } catch (error) {
            console.error("Token refresh failed:", error)
          }
        }
      }

      if (user) {
        token.accessToken = (user as any).accessToken
        token.user = user
      }
      return token
    },
    async session({ session, token }: any) {
      if (token.accessToken) {
        session.accessToken = token.accessToken
        session.user = {
          ...session.user,
          id: (token.user as any)?.id,
          onboarding_completed: (token.user as any)?.onboarding_completed
        }
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
})

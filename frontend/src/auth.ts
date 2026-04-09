import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async jwt({ token, account, user, trigger, session }) {
      if (trigger === "update") {
        if (session?.user) {
          token.user = { ...(token.user as any), ...session.user }
        }
        if (session?.action === "refresh" && token.accessToken) {
          try {
            const res = await fetch("http://127.0.0.1:8000/api/v1/auth/refresh", {
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
      
      // Step 2 from WORKFLOW-google-auth.md: Handoff to Backend
      if (account && user) {
        try {
          // In a real flow, the backend would verify the id_token from Google.
          // For Phase 1 Dev, we exchange it for a session token from our FastAPI backend.
          const res = await fetch("http://127.0.0.1:8000/api/v1/auth/google", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              email: user.email,
              google_id: user.id,
              name: user.name,
              id_token: account.id_token 
            }),
          })

          if (res.ok) {
            const data = await res.json()
            token.accessToken = data.data.access_token
            token.user = data.data.user
          } else {
            console.error("Backend auth failed")
            // If backend is not ready, we can mock it for parallel development.
            // token.accessToken = "mock-dev-token"
            // token.user = { ...user, onboarding_completed: false }
          }
        } catch (error) {
          console.error("Error during JWT callback:", error)
        }
      }
      return token
    },
    async session({ session, token }: any) {
      if (token.accessToken) {
        session.accessToken = token.accessToken
        session.user = { 
          ...session.user, 
          id: token.user?.id,
          onboarding_completed: token.user?.onboarding_completed 
        }
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
})

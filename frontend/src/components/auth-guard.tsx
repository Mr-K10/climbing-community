"use client"

import { useSession, signOut } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import { useEffect } from "react"

const PUBLIC_ROUTES = ["/login", "/register", "/forgot-password", "/reset-password", "/"]

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status, update } = useSession()
  const router = useRouter()
  const pathname = usePathname()

  // Auto logout if token is expired
  useEffect(() => {
    if (session?.accessToken) {
      try {
        // Decode JWT payload (base64url)
        const base64Url = session.accessToken.split(".")[1]
        const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/")
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split("")
            .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
            .join("")
        )
        const payload = JSON.parse(jsonPayload)
        
        // Final expiry check
        if (payload.exp && Date.now() >= payload.exp * 1000) {
          console.warn("Token expired, signing out...")
          signOut({ callbackUrl: "/login" })
          return
        }

        // Sliding session: refresh if older than 12 hours
        if (payload.iat) {
          const ageInSeconds = Math.floor(Date.now() / 1000) - payload.iat
          if (ageInSeconds > 12 * 3600) {
            console.log("Token is getting old (>12h), refreshing...")
            update({ action: "refresh" })
          }
        }
      } catch (e) {
        console.error("Error checking token state", e)
      }
    }
  }, [session, update])

  useEffect(() => {
    if (status === "loading") return

    if (!session) {
      if (!PUBLIC_ROUTES.includes(pathname)) {
        router.push("/login")
      }
    } else {
      // Logic for authenticated users
      if (pathname === "/login") {
        router.push("/profile")
      } else if (!session.user?.onboarding_completed) {
        if (pathname !== "/onboarding") {
           router.push("/onboarding")
        }
      } else if (pathname === "/onboarding") {
          router.push("/profile")
      }
    }
  }, [session, status, pathname, router])

  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const shouldRedirectAwayFromPublic = !!session && (pathname === "/login" || pathname === "/register");
  const shouldRedirectToLogin = !session && !isPublicRoute;
  const shouldRedirectToOnboarding = !!session && !session.user?.onboarding_completed && pathname !== "/onboarding";
  const shouldRedirectAwayFromOnboarding = !!session && !!session.user?.onboarding_completed && pathname === "/onboarding";

  if (status === "loading" || shouldRedirectAwayFromPublic || shouldRedirectToLogin || shouldRedirectToOnboarding || shouldRedirectAwayFromOnboarding) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return <>{children}</>
}

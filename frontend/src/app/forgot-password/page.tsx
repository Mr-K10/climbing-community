"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Mountain, Loader2, ArrowLeft, CheckCircle2 } from "lucide-react"
import { useState } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000"
      const res = await fetch(`${apiBase}/api/v1/auth/password-reset/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      if (res.ok) {
        setSubmitted(true)
      } else {
        const data = await res.json()
        setError(data.detail || "Something went wrong")
      }
    } catch (err) {
      setError("An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="fixed inset-0 bg-gradient-to-b from-slate-950 to-black text-white selection:bg-primary/30 flex items-center justify-center p-6 mt-0">
      <Card className="w-full max-w-md bg-white/5 border-white/10 backdrop-blur-md">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="bg-primary/10 p-3 rounded-2xl ring-1 ring-primary/20">
              <Mountain className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-white">Reset Password</CardTitle>
          <CardDescription className="text-gray-400">
            Enter your email to receive a password reset link
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!submitted ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-white/5 border-white/10 focus:border-primary/50"
                />
              </div>
              {error && (
                <p className="text-sm text-red-400 text-center font-medium bg-red-400/10 py-2 rounded-lg border border-red-400/20">
                  {error}
                </p>
              )}
              <Button 
                type="submit"
                disabled={loading}
                className="w-full bg-primary hover:bg-primary/90 text-white h-12 rounded-xl transition-all font-semibold"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Send Reset Link"}
              </Button>
              <div className="text-center mt-4">
                <Link href="/login" className="text-sm text-gray-400 hover:text-white flex items-center justify-center gap-2 group transition-colors">
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                  Back to Sign In
                </Link>
              </div>
            </form>
          ) : (
            <div className="text-center space-y-6 py-4">
              <div className="flex justify-center">
                <div className="bg-green-500/10 p-4 rounded-full">
                  <CheckCircle2 className="w-12 h-12 text-green-500" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-medium">Check your email</p>
                <p className="text-sm text-gray-400">
                  We've sent a password reset link to <span className="text-white font-medium">{email}</span>.
                </p>
              </div>
              <Link href="/login">
                <Button variant="outline" className="w-full border-white/10 text-white hover:bg-white/5">
                  Return to Sign In
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  )
}

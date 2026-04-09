"use client"

import { useSession, signOut } from "next-auth/react"
import { Button } from "@/components/ui/button"
import { LogOut, Mountain, LogIn, GraduationCap, Zap } from "lucide-react"
import Link from "next/link"
import { useState } from "react"
import { KeywordSelector } from "@/components/keyword-selector"

export default function Navbar() {
  const { data: session } = useSession()
  const [isKeywordModalOpen, setIsKeywordModalOpen] = useState(false)

  return (
    <>
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-black/40 backdrop-blur-xl transition-colors duration-300">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 items-center justify-between">
          <div className="flex items-center gap-2 group">
            <Link 
              href={session ? "/profile" : "/"} 
              className="flex items-center gap-2 hover:opacity-90 transition-all duration-300"
            >
              <div className="relative">
                <Mountain className="w-8 h-8 text-primary relative z-10" />
                <div className="absolute inset-0 blur-lg bg-primary/20 rounded-full scale-150 animate-pulse" />
              </div>
              <span className="text-xl md:text-2xl font-black tracking-tighter text-white">
                CLIMBING<span className="text-primary italic hidden sm:inline">COMMUNITY</span><span className="text-primary italic sm:hidden">C</span>
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-6">
            {session ? (
              <>
                <div className="hidden lg:flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                  <span className="text-xs font-medium text-gray-400 uppercase tracking-widest">Basecamp:</span>
                  <span className="text-sm font-bold text-white leading-none">{session.user?.name}</span>
                </div>
                
                <Button 
                  onClick={() => setIsKeywordModalOpen(true)} 
                  className="rounded-full bg-primary hover:bg-primary/90 text-black transition-all duration-300 flex items-center gap-2 px-6 h-11 font-black text-[10px] tracking-widest uppercase shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)]"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span className="hidden sm:inline">Start Skills Quiz</span>
                  <Zap className="w-3 h-3 fill-current animate-pulse" />
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="rounded-full border-white/10 bg-white/5 hover:bg-white/10 hover:border-primary hover:text-primary transition-all duration-300 flex items-center gap-2 px-6 h-11"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="font-semibold uppercase text-xs tracking-wider">Logout</span>
                </Button>
              </>
            ) : (
              <Link href="/login">
                <Button
                  size="sm"
                  className="rounded-full bg-primary hover:bg-primary/90 text-black transition-all duration-300 flex items-center gap-2 px-8 h-11 font-bold uppercase text-xs tracking-wider shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.5)]"
                >
                  <LogIn className="w-4 h-4 text-black" />
                  <span>Join Basecamp</span>
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
    {isKeywordModalOpen && (
      <KeywordSelector onClose={() => setIsKeywordModalOpen(false)} />
    )}
    </>
  )
}

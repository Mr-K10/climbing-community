import { Button } from "@/components/ui/button"
import { ArrowRight, Mountain, Shield, Zap, Users, Trophy } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-black">
      {/* Hero Section */}
      <section className="relative h-[90vh] flex items-center justify-center overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1522163182402-834f871fd851?ixlib=rb-4.0.3&auto=format&fit=crop&q=80&w=2070"
            alt="Climbing Hero"
            fill
            className="object-cover opacity-60 scale-105 animate-slow-zoom text-slate-800"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
        </div>

        <div className="container relative z-10 px-4 mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-8 text-xs font-bold tracking-widest uppercase border rounded-full border-primary/30 bg-primary/10 text-primary animate-fade-in">
            <span className="relative flex w-2 h-2">
              <span className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping bg-primary"></span>
              <span className="relative inline-flex w-2 h-2 rounded-full bg-primary"></span>
            </span>
            Season 2026 Now Live
          </div>
          
          <h1 className="mb-6 text-6xl font-black tracking-tighter text-white md:text-8xl lg:text-9xl animate-slide-up">
            ASCEND <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-lime-400 text-glow">BEYOND.</span>
          </h1>
          
          <p className="max-w-2xl mx-auto mb-10 text-lg font-medium text-gray-300 md:text-xl animate-slide-up delay-100">
            The elite platform for climbers. Track your progression, master the wall with AI-driven coaching, and connect with the global climbing community.
          </p>

          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row animate-slide-up delay-200">
            <Link href="/login">
              <Button size="lg" className="h-14 px-10 text-base font-bold uppercase tracking-wider rounded-full bg-primary hover:bg-primary/90 text-black shadow-[0_0_30px_rgba(var(--primary-rgb),0.3)] hover:scale-105 transition-all">
                Get Started <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/quiz">
              <Button size="lg" variant="outline" className="h-14 px-10 text-base font-bold uppercase tracking-wider rounded-full border-white/20 bg-white/5 hover:bg-white/10 hover:border-primary backdrop-blur-sm transition-all">
                Take the Skill Quiz
              </Button>
            </Link>
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce flex flex-col items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40">Explore</span>
          <div className="w-px h-12 bg-gradient-to-b from-primary to-transparent" />
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 bg-black border-t border-white/5">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-3">
            <div className="group p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all">
              <div className="flex items-center justify-center w-14 h-14 mb-6 rounded-2xl bg-primary/10 border border-primary/20 text-primary group-hover:scale-110 transition-transform">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="mb-4 text-2xl font-bold text-white">Secure Profiles</h3>
              <p className="text-gray-400 leading-relaxed">
                Your climbing data and preferences are secured with enterprise-grade authentication.
              </p>
            </div>

            <div className="group p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all">
              <div className="flex items-center justify-center w-14 h-14 mb-6 rounded-2xl bg-primary/10 border border-primary/20 text-primary group-hover:scale-110 transition-transform">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="mb-4 text-2xl font-bold text-white">Smart Progression</h3>
              <p className="text-gray-400 leading-relaxed">
                Adaptive quizzes and AI-driven coaching plans help you break through plateaus faster than ever.
              </p>
            </div>

            <div className="group p-8 rounded-3xl bg-white/[0.02] border border-white/5 hover:border-primary/20 transition-all">
              <div className="flex items-center justify-center w-14 h-14 mb-6 rounded-2xl bg-primary/10 border border-primary/20 text-primary group-hover:scale-110 transition-transform">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="mb-4 text-2xl font-bold text-white">Community Driven</h3>
              <p className="text-gray-400 leading-relaxed">
                Share your sends, discuss routes, and find climbing partners in your local area.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats / CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary opacity-[0.02]" />
        <div className="container relative z-10 px-4 mx-auto">
          <div className="flex flex-col items-center justify-center p-12 md:p-20 rounded-[40px] bg-gradient-to-br from-white/[0.05] to-transparent border border-white/10 text-center">
            <Trophy className="w-16 h-16 text-primary mb-8 animate-pulse" />
            <h2 className="mb-6 text-4xl md:text-5xl font-black tracking-tight text-white">READY TO SEND YOUR FIRST V10?</h2>
            <p className="max-w-xl mx-auto mb-10 text-lg text-gray-400">
              Join thousands of climbers already using Climbing Community to elevate their game.
            </p>
            <Link href="/login">
              <Button size="lg" className="h-14 px-12 text-base font-bold uppercase tracking-wider rounded-full bg-white hover:bg-gray-200 text-black">
                Join the Crew
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-white/5 text-center text-gray-500 text-sm">
        <div className="container px-4 mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Mountain className="w-5 h-5 text-gray-400" />
            <span className="font-bold tracking-tighter text-white">CLIMBING<span className="text-primary italic">COMMUNITY</span></span>
          </div>
          <div className="flex gap-8">
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Connect</a>
          </div>
          <p>© 2026 Climbing Community. Elevate your journey.</p>
        </div>
      </footer>
    </div>
  )
}

"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { Check, Loader2, X } from "lucide-react"
import { useQuizInit } from "@/hooks/use-climbing-api"
import { useRouter } from "next/navigation"

const KEYWORDS = [
  "hampi", "sethan", "bangalore", "history", "sport",
  "trad", "bouldering", "rescue", "training", "mindset", "badami", "yosemite"
]

interface KeywordSelectorProps {
  onClose: () => void;
}

export function KeywordSelector({ onClose }: KeywordSelectorProps) {
  const [selected, setSelected] = useState<string[]>([])
  const initQuiz = useQuizInit()
  const router = useRouter()

  const toggleKeyword = (kw: string) => {
    setSelected(prev => 
      prev.includes(kw) 
        ? prev.filter(k => k !== kw) 
        : prev.length < 12 ? [...prev, kw] : prev
    )
  }

  const handleStart = () => {
    // allow selected.length === 0 for generic assessment
    initQuiz.mutate(selected, {
      onSuccess: (data) => {
          // Store session data and route to quiz
          // The backend returns AdaptiveQuestionResponse
          // We can use session storage or just query params
          onClose() // Close modal before navigation to prevent it from lingering
          router.push(`/quiz?session_id=${data.session_id}`)
      }
    })
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
        <Card className="w-full max-w-xl border-none bg-card/60 backdrop-blur-xl shadow-2xl ring-1 ring-white/10 relative overflow-hidden my-auto">
            <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-2 right-2 sm:top-4 sm:right-4 z-10 text-muted-foreground hover:bg-white/5 rounded-full"
                onClick={onClose}
                disabled={initQuiz.isPending}
            >
                <X className="w-5 h-5" />
            </Button>

            <CardHeader className="pt-8 sm:pt-10 px-6 sm:px-8">
                <CardTitle className="text-2xl sm:text-3xl font-black tracking-tighter text-glow italic">SELECT FOCUS AREAS</CardTitle>
                <CardDescription className="text-muted-foreground text-base sm:text-lg">
                    Choose up to 12 keywords or start with none for a generic session.
                </CardDescription>
            </CardHeader>

            <CardContent className="px-6 sm:px-8 pb-8 sm:pb-10 space-y-6 sm:space-y-8">
                <div className="max-h-[45vh] sm:max-h-[50vh] overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3 py-1">
                        {KEYWORDS.map((kw) => {
                            const isSelected = selected.includes(kw)
                            return (
                                <button
                                    key={kw}
                                    onClick={() => toggleKeyword(kw)}
                                    disabled={initQuiz.isPending}
                                    className={cn(
                                        "px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border text-[10px] sm:text-sm font-bold uppercase tracking-wider transition-all duration-300",
                                        isSelected 
                                            ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20 scale-[1.05]" 
                                            : "bg-white/5 border-white/5 text-muted-foreground hover:bg-white/10 hover:border-white/10"
                                    )}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        {isSelected && <Check className="w-3 h-3 sm:w-4 sm:h-4" />}
                                        {kw}
                                    </div>
                                </button>
                            )
                        })}
                    </div>
                </div>

                <div className="flex flex-col gap-4">
                    {initQuiz.isError && (
                        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-medium animate-slide-up">
                            {initQuiz.error.message === "TIMEOUT_ERROR" 
                                ? "Generating your session took longer than expected. Please try again."
                                : "Failed to initialize assessment. Check your connection and retry."
                            }
                        </div>
                    )}

                    <Button 
                        size="lg" 
                        className="w-full rounded-2xl h-14 sm:h-16 text-base sm:text-lg font-black tracking-widest shadow-2xl shadow-primary/20 transition-all active:scale-[0.98]"
                        onClick={handleStart}
                        disabled={selected.length === 0 || initQuiz.isPending}
                    >
                        {initQuiz.isPending ? (
                            <div className="flex items-center gap-3">
                                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                                <span className="text-sm sm:text-base">Generating session...</span>
                            </div>
                        ) : (
                            "START ASSESSMENT"
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>
  )
}

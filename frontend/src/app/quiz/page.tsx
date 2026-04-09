"use client"

import { useState, useEffect, Suspense } from "react"
import { useAdaptiveQuiz, useSubmitAdaptiveAnswer } from "@/hooks/use-climbing-api"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useRouter, useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { CheckCircle2, XCircle, ArrowRight, Loader2, Award, Zap, ExternalLink } from "lucide-react"
import { AdaptiveQuestion } from "@/types"

function QuizContent() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get("session_id")
  const router = useRouter()
  
  const { data: initialSession, isLoading: isFetchingStatus, isError } = useAdaptiveQuiz(sessionId)
  const submitAnswer = useSubmitAdaptiveAnswer()
  
  const [currentQuestion, setCurrentQuestion] = useState<AdaptiveQuestion | null>(null)
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null)
  const [isCompleted, setIsCompleted] = useState(false)
  const [result, setResult] = useState<{ is_correct: boolean, explanation: string, correct_option_id: string, next_question?: AdaptiveQuestion } | null>(null)

  useEffect(() => {
    if (initialSession) {
      if (initialSession.status === "completed") {
        setIsCompleted(true)
      } else {
        setCurrentQuestion(initialSession.question)
      }
    }
  }, [initialSession])

  if (isFetchingStatus || !sessionId) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse text-xl">Entering focus session...</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <XCircle className="w-12 h-12 text-destructive" />
        <p className="text-xl font-bold">Session connection lost</p>
        <Button onClick={() => window.location.reload()} variant="outline" className="rounded-xl px-8">Retry Connection</Button>
      </div>
    )
  }

  if (isCompleted) {
    return (
      <div className="max-w-2xl mx-auto pt-12 text-center space-y-8 animate-in fade-in slide-in-from-bottom-10 duration-1000">
        <div className="relative inline-block">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
            <div className="w-24 h-24 bg-primary rounded-3xl flex items-center justify-center rotate-12 relative shadow-2xl">
              <Award className="w-12 h-12 text-primary-foreground -rotate-12" />
            </div>
        </div>
        <div className="space-y-4">
            <h1 className="text-5xl font-black tracking-tighter italic text-glow">SESSION COMPLETE</h1>
            <p className="text-muted-foreground text-xl max-w-md mx-auto">
                Your knowledge delta is being calculated by our agents. The results will be visible in your dashboard shortly.
            </p>
        </div>
        <Button 
            onClick={() => router.push("/profile")} 
            size="lg" 
            className="rounded-2xl h-16 px-12 text-lg font-black tracking-widest shadow-xl shadow-primary/20 active:scale-95 transition-all"
        >
          RETURN TO DASHBOARD
        </Button>
      </div>
    )
  }

  const handleOptionClick = (optionId: string) => {
    if (result || submitAnswer.isPending) return
    setSelectedOptionId(optionId)
  }

  const handleSubmit = () => {
    if (!selectedOptionId || !currentQuestion) return
    submitAnswer.mutate({
      sessionId,
      questionId: currentQuestion.id,
      optionId: selectedOptionId
    }, {
      onSuccess: (data) => {
        setResult({
          is_correct: data.is_correct,
          explanation: data.explanation,
          correct_option_id: data.correct_option_id,
          next_question: data.next_question
        })
        if (data.status === "completed") {
            // Wait for user to read explanation before showing done
        }
      }
    })
  }

  const handleNext = () => {
    if (!result) return
    
    if (result.next_question) {
        setCurrentQuestion(result.next_question)
        setSelectedOptionId(null)
        setResult(null)
        window.scrollTo({ top: 0, behavior: "smooth" })
    } else {
        setIsCompleted(true)
    }
  }

  if (!currentQuestion) return null

  return (
    <div className="max-w-3xl mx-auto pt-6 pb-24 px-6 animate-in fade-in duration-1000">
      <div className="mb-12 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full border border-primary/20">
            <Zap className="w-3.5 h-3.5 text-primary fill-primary" />
            <h2 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Live Assessment</h2>
          </div>
          <p className={cn(
            "text-3xl font-black tracking-tight uppercase italic transition-all duration-1000",
            !result && "opacity-40 blur-[2px]"
          )}>
            {result ? currentQuestion.category : "Assessment Context"}
          </p>
        </div>
        <div className="w-full md:w-64 space-y-2">
            <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
                <span>Progress Bound</span>
                <span>Adaptive</span>
            </div>
            <Progress value={result ? 100 : 50} className="h-2 bg-white/5 border border-white/5 rounded-full overflow-hidden" />
        </div>
      </div>

      <Card className={cn(
          "border-none bg-card/40 backdrop-blur-3xl shadow-2xl ring-1 ring-white/10 overflow-hidden transition-all duration-700",
          submitAnswer.isPending && "opacity-50 grayscale-[0.5] scale-[0.98]"
      )}>
        <CardHeader className="pt-8 px-10 pb-6">
          <div className="flex flex-wrap gap-2 mb-2 opacity-60">
            {currentQuestion.primary_topics?.map((topic, i) => (
              <span key={`primary-${i}`} className="text-[10px] font-black uppercase tracking-widest text-primary">
                {topic}
              </span>
            ))}
            {currentQuestion.secondary_topics?.map((topic, i) => (
              <span key={`secondary-${i}`} className="text-[10px] font-black uppercase tracking-widest">
                • {topic}
              </span>
            ))}
          </div>
          <CardTitle className="text-2xl md:text-3xl font-bold leading-[1.3] tracking-tight">
            {currentQuestion.text}
          </CardTitle>
        </CardHeader>
        
        {currentQuestion.image_url && (
            <div className="px-10 pb-8 animate-in zoom-in duration-1000">
                <div className="relative aspect-video rounded-[32px] overflow-hidden border-4 border-white/5 shadow-2xl shadow-black/40 group">
                    <img 
                      src={currentQuestion.image_url} 
                      alt="Climbing movement illustration" 
                      className="object-cover w-full h-full transition-transform duration-[2000ms] group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-6 opacity-0 group-hover:opacity-100 transition-opacity">
                        <p className="text-white text-sm font-bold tracking-widest uppercase italic">Visual Reference</p>
                    </div>
                </div>
            </div>
        )}
        
        <CardContent className="px-10 pb-10 grid gap-4">
          {currentQuestion.options.map((option) => {
            const isSelected = selectedOptionId === option.id
            const isCorrect = result?.is_correct && isSelected
            const isActuallyCorrect = result && !result.is_correct && option.id === result.correct_option_id
            const isWrong = result && !result.is_correct && isSelected

            return (
              <button
                key={option.id}
                onClick={() => handleOptionClick(option.id)}
                disabled={!!result || submitAnswer.isPending}
                className={cn(
                  "flex items-center justify-between p-6 rounded-2xl border-2 text-left transition-all duration-500 relative group",
                  isSelected && !result && "border-primary bg-primary/5 shadow-2xl shadow-primary/10 -translate-y-1",
                  !isSelected && !result && "border-white/5 bg-white/5 hover:bg-white/10 hover:border-white/20",
                  isCorrect && "border-green-500 bg-green-500/10 shadow-lg shadow-green-500/10",
                  isWrong && "border-destructive bg-destructive/10 grayscale-[0.2]",
                  isActuallyCorrect && "border-green-500/50 bg-green-500/5",
                  result && !isSelected && !isActuallyCorrect && "opacity-30 border-transparent",
                  !result && "hover:-translate-y-0.5"
                )}
              >
                <span className="font-bold text-lg md:text-xl">{option.text}</span>
                {isCorrect && (
                    <div className="p-1 bg-green-500 rounded-full animate-bounce">
                        <CheckCircle2 className="w-5 h-5 text-black" />
                    </div>
                )}
                {isWrong && (
                    <div className="p-1 bg-destructive rounded-full animate-pulse">
                        <XCircle className="w-5 h-5 text-black" />
                    </div>
                )}
                {isActuallyCorrect && (
                    <div className="p-1 bg-green-500/20 rounded-full">
                        <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </div>
                )}
              </button>
            )
          })}
        </CardContent>

        {result && (
          <div className={cn(
            "px-10 py-10 border-t border-white/5 animate-slide-up",
            result.is_correct ? "bg-green-500/5" : "bg-destructive/5"
          )}>
            <div className="flex gap-6 items-start">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-xl",
                result.is_correct ? "bg-green-500/20 text-green-500" : "bg-destructive/20 text-destructive"
              )}>
                {result.is_correct ? <CheckCircle2 className="w-6 h-6" /> : <XCircle className="w-6 h-6" />}
              </div>
              <div className="space-y-2">
                <div className="flex flex-col gap-1">
                  <p className="text-[10px] font-black tracking-[0.3em] uppercase text-primary/60">Knowledge Sector: {currentQuestion.category}</p>
                  <p className="font-black text-xl tracking-tight uppercase italic underline decoration-2 underline-offset-4">
                    {result.is_correct ? "AGENT VALIDATED" : "INCORRECT CALIBRATION"}
                  </p>
                </div>
                <p className="text-muted-foreground text-lg leading-relaxed font-semibold italic">
                  "{result.explanation}"
                </p>
                {currentQuestion.sources && currentQuestion.sources.length > 0 && (
                  <div className="pt-4 mt-4 border-t border-white/5 space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Verification & Sources</p>
                    <div className="flex flex-wrap gap-3">
                      {currentQuestion.sources.map((source, i) => (
                        <a 
                          key={i} 
                          href={source.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 bg-white/5 hover:bg-white/10 px-4 py-2 rounded-xl text-xs font-bold transition-colors border border-white/5 group"
                        >
                          <ExternalLink className="w-3 h-3 group-hover:text-primary transition-colors" />
                          <span>{source.title}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <CardFooter className="px-10 py-10 pt-4 flex flex-col sm:flex-row justify-end gap-4 bg-black/20">
          {!result ? (
            <Button 
                onClick={handleSubmit} 
                disabled={!selectedOptionId || submitAnswer.isPending}
                size="lg"
                className="w-full sm:w-auto h-16 px-12 rounded-2xl font-black text-lg shadow-2xl shadow-primary/20 active:scale-95 transition-all"
            >
              {submitAnswer.isPending ? (
                <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>Analyzing Response...</span>
                </div>
              ) : "CALIBRATE"}
            </Button>
          ) : (
            <Button 
                onClick={handleNext} 
                size="lg"
                className="w-full sm:w-auto h-16 px-12 rounded-2xl font-black text-lg bg-foreground text-background hover:bg-foreground/90 group active:scale-95 transition-all italic"
            >
              {result.next_question ? "ADVANCE PHASE" : "FINALIZE SESSION"}
              <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-2 transition-transform" />
            </Button>
          )}
        </CardFooter>
      </Card>

      {submitAnswer.isError && (
          <div className="mt-8 p-6 rounded-2xl bg-destructive/10 border border-destructive/20 flex items-center justify-between text-destructive animate-slide-up">
              <div className="flex items-center gap-3 font-bold">
                  <XCircle className="w-5 h-5 text-destructive" />
                  Failed to process. Please retry the submission.
              </div>
              <Button onClick={handleSubmit} variant="outline" size="sm" className="rounded-xl border-destructive/50 hover:bg-destructive/10">Retry submit</Button>
          </div>
      )}
    </div>
  )
}

export default function QuizPage() {
    return (
        <Suspense fallback={
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse text-xl font-medium">Calibrating workspace...</p>
            </div>
        }>
            <QuizContent />
        </Suspense>
    )
}

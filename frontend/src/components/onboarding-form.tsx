"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useUpdatePreferences } from "@/hooks/use-climbing-api"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import { cn } from "@/lib/utils"

const onboardingSchema = z.object({
  primary_discipline: z.string().min(1, "Please select a discipline"),
  current_grade: z.string().min(1, "Please select your current grade"),
  indoor_vs_outdoor: z.string().min(1, "Please select your primary focus"),
  goal: z.string()
})

type OnboardingData = z.infer<typeof onboardingSchema>

const STEPS = [
  {
    id: "discipline" as const,
    title: "Primary Discipline",
    description: "What style of climbing do you spend most of your time on?",
    options: ["Bouldering", "Sport", "Trad"],
    field: "primary_discipline" as const
  },
  {
    id: "grade" as const,
    title: "Current Grade",
    description: "What grade are you currently consistently sending?",
    options: ["4 / V0", "6A / V3", "7A / V6", "6b / 5.10", "6c+ / 5.11", "7b+ / 5.12"],
    field: "current_grade" as const
  },
  {
    id: "focus" as const,
    title: "Indoor vs Outdoor",
    description: "Where do you do most of your climbing?",
    options: ["Indoor Focused", "Outdoor Focused", "Hybrid"],
    field: "indoor_vs_outdoor" as const
  }
]

export default function OnboardingForm() {
  const [step, setStep] = useState(0)
  const updatePrefs = useUpdatePreferences()
  const router = useRouter()

  const {
    setValue,
    handleSubmit,
    watch,
    formState: { isValid }
  } = useForm<OnboardingData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      primary_discipline: "",
      current_grade: "",
      indoor_vs_outdoor: "",
      goal: "improve_technique"
    }
  })

  const formData = watch()
  const currentStep = STEPS[step]
  const progress = ((step + 1) / STEPS.length) * 100

  const handleSelect = (option: string) => {
    // Preserve casing specifically for grade strings
    const value = currentStep.field === "current_grade" 
      ? option 
      : option.toLowerCase().replace(" ", "_");
      
    setValue(currentStep.field, value, { shouldValidate: true })
    
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    }
  }

  const { update } = useSession()
  
  const onSubmit = (data: OnboardingData) => {
    updatePrefs.mutate(data, {
      onSuccess: async () => {
        await update({ 
          user: { onboarding_completed: true } 
        })
        router.push("/quiz")
      }
    })
  }

  const isStepComplete = !!formData[currentStep.field]

  return (
    <div className="max-w-md mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="mb-8">
        <div className="flex justify-between text-sm mb-2 font-medium">
          <span className="text-muted-foreground">Step {step + 1} of {STEPS.length}</span>
          <span className="text-primary">{currentStep.title}</span>
        </div>
        <Progress value={progress} className="h-1 bg-muted overflow-hidden" />
      </div>

      <Card className="border-none bg-card/40 backdrop-blur-xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.3)] ring-1 ring-white/10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-transparent pointer-events-none" />
        
        <CardHeader className="relative">
          <CardTitle className="text-3xl font-extrabold tracking-tighter text-center bg-clip-text text-transparent bg-gradient-to-b from-foreground to-foreground/70">
            {currentStep.title}
          </CardTitle>
          <p className="text-center text-muted-foreground mt-2 text-sm">
            {currentStep.description}
          </p>
        </CardHeader>
        
        <CardContent className="grid gap-4 mt-4 relative">
          {currentStep.options.map((option) => {
            const value = option.toLowerCase().replace(" ", "_")
            const isSelected = formData[currentStep.field] === value
            
            return (
              <Button
                key={option}
                variant={isSelected ? "default" : "outline"}
                size="lg"
                className={cn(
                  "h-16 text-lg transition-all duration-300 border-white/5",
                  isSelected 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02]" 
                    : "bg-white/5 hover:bg-white/10 hover:border-white/20"
                )}
                onClick={() => handleSelect(option)}
                disabled={updatePrefs.isPending}
              >
                {option}
              </Button>
            )
          })}
        </CardContent>

        <CardFooter className="justify-between relative pb-8">
          <Button 
            variant="ghost" 
            onClick={() => setStep(step - 1)}
            disabled={step === 0 || updatePrefs.isPending}
            className="text-muted-foreground hover:text-foreground"
          >
            Back
          </Button>

          {step === STEPS.length - 1 && (
            <Button
              onClick={(e) => handleSubmit(onSubmit)(e)}
              disabled={!isValid || updatePrefs.isPending}
              className="px-8 shadow-xl shadow-primary/20"
            >
              {updatePrefs.isPending ? "Setting up..." : "Complete Profile"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  )
}

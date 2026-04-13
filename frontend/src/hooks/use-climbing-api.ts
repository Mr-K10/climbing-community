"use client"

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { useSession, signOut } from "next-auth/react"
import { QuizSession, AnswerResponse, UserProfile, AdaptiveQuestionResponse, AdaptiveAnswerResponse } from "@/types"

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000") + "/api/v1"

async function climbingFetch(url: string, options: RequestInit = {}) {
  const res = await fetch(url, options)
  if (res.status === 401) {
    console.error("Session expired or unauthorized. Logging out...")
    signOut({ callbackUrl: "/login" })
    throw new Error("UNAUTHORIZED")
  }
  return res
}

export function useAdaptiveQuiz(sessionId: string | null) {
  const { data: session } = useSession()
  return useQuery<AdaptiveQuestionResponse>({
    queryKey: ["quiz", sessionId],
    queryFn: async () => {
      const res = await climbingFetch(`${API_BASE}/quiz/${sessionId}`, {
        headers: {
          "Authorization": `Bearer ${session?.accessToken}`
        }
      })
      if (!res.ok) throw new Error("Failed to fetch adaptive quiz session")
      const json = await res.json()
      return json
    },
    enabled: !!session?.accessToken && !!sessionId
  })
}

export function useQuiz() {
  const { data: session } = useSession()
  return useQuery<QuizSession>({
    queryKey: ["quiz", "static"],
    queryFn: async () => {
      const res = await climbingFetch(`${API_BASE}/quiz/static`, {
        headers: {
          "Authorization": `Bearer ${session?.accessToken}`
        }
      })
      if (!res.ok) throw new Error("Failed to fetch quiz")
      const json = await res.json()
      return json.data
    },
    enabled: !!session?.accessToken
  })
}

export function useQuizInit() {
    const { data: session } = useSession()
    return useMutation<AdaptiveQuestionResponse, Error, string[]>({
        mutationFn: async (keywords: string[]) => {
            const res = await climbingFetch(`${API_BASE}/quiz/init`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.accessToken}`
                },
                body: JSON.stringify({ keywords })
            })
            if (!res.ok) {
                if (res.status === 504) throw new Error("TIMEOUT_ERROR")
                throw new Error("Failed to initialize quiz")
            }
            const json = await res.json()
            return json
        }
    })
}

export function useSubmitAdaptiveAnswer() {
    const { data: session } = useSession()
    const queryClient = useQueryClient()
    return useMutation<AdaptiveAnswerResponse, Error, { sessionId: string, questionId: string, optionId: string }>({
        mutationFn: async ({ sessionId, questionId, optionId }) => {
            const res = await climbingFetch(`${API_BASE}/quiz/${sessionId}/answer`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${session?.accessToken}`
                },
                body: JSON.stringify({ question_id: questionId, selected_option_id: optionId })
            })
            if (!res.ok) throw new Error("Failed to submit adaptive answer")
            const json = await res.json()
            return json
        },
        onSuccess: (data) => {
            if (data.status === "completed") {
                queryClient.invalidateQueries({ queryKey: ["profile"] })
            }
        }
    })
}

export function useSubmitAnswer() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ sessionId, questionId, optionId }: { sessionId: string, questionId: string, optionId: string }) => {
      const res = await climbingFetch(`${API_BASE}/quiz/static/${sessionId}/answer`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify({ question_id: questionId, selected_option_id: optionId })
      })
      if (!res.ok) throw new Error("Failed to submit answer")
      const json = await res.json()
      return json.data as AnswerResponse
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] })
    }
  })
}

export function useProfile() {
  const { data: session } = useSession()
  return useQuery<UserProfile>({
    queryKey: ["profile"],
    queryFn: async () => {
      const res = await climbingFetch(`${API_BASE}/profile`, {
        headers: {
          "Authorization": `Bearer ${session?.accessToken}`
        }
      })
      if (!res.ok) throw new Error("Failed to fetch profile")
      const json = await res.json()
      return json.data
    },
    enabled: !!session?.accessToken,
    refetchInterval: (query) => {
        return query.state.data?.status === "updating" ? 2000 : false
    }
  })
}

export function useUpdatePreferences() {
  const { data: session } = useSession()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (prefs: UserProfile["preferences"]) => {
      const res = await climbingFetch(`${API_BASE}/profile/preferences`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session?.accessToken}`
        },
        body: JSON.stringify(prefs)
      })
      if (!res.ok) throw new Error("Failed to update preferences")
      const json = await res.json()
      return json.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] })
    }
  })
}

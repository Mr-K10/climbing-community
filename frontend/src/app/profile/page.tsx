"use client"

import { useState, useMemo } from "react"
import { signOut, useSession } from "next-auth/react"
import { useProfile } from "@/hooks/use-climbing-api"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, TrendingUp, Calendar, Trophy, Zap, Mountain, User, GraduationCap, LogOut, Search, ShieldCheck, Target } from "lucide-react"
import { KeywordSelector } from "@/components/keyword-selector"
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"
import { cn } from "@/lib/utils"

// Grade Scales
const BOULDER_GRADES = ["V0", "V1", "V2", "V3", "V4", "V5", "V6", "V7", "V8", "V9", "V10", "V11", "V12"];
const SPORT_GRADES = ["5.5", "5.6", "5.7", "5.8", "5.9", "5.10a", "5.10b", "5.10c", "5.10d", "5.11a", "5.11b", "5.11c", "5.11d", "5.12a", "5.12b", "5.12c", "5.12d", "5.13a", "5.13b"];

// Weights by Discipline
const WEIGHTS = {
  bouldering: {
    technique: 0.35,
    training_science: 0.25,
    mindset: 0.20,
    safety: 0.10,
    rope_skills: 0.05,
    terminology: 0.05,
  },
  sport: {
    technique: 0.25,
    safety: 0.20,
    mindset: 0.20,
    training_science: 0.15,
    rope_skills: 0.15,
    terminology: 0.05,
  },
  trad: {
    safety: 0.25,
    rope_skills: 0.25,
    technique: 0.20,
    mindset: 0.20,
    training_science: 0.05,
    terminology: 0.05,
  }
};

function calculateQuizGrade(radar: Record<string, number>, discipline: string) {
  const d = (discipline.toLowerCase() as keyof typeof WEIGHTS) || "bouldering";
  const w = WEIGHTS[d];
  
  // Normalize radar keys to match weights (case-insensitive and space/underscore neutral)
  const normalizedRadar: Record<string, number> = {};
  Object.entries(radar).forEach(([k, v]) => {
    normalizedRadar[k.toLowerCase().replace(" ", "_")] = v;
  });

  // Calculate Weighted Score
  let compositeScore = 0;
  Object.entries(w).forEach(([skill, weight]) => {
    compositeScore += (normalizedRadar[skill] || 0) * weight;
  });

  // Exponential Progression: (Score/100)^1.3 to simulate difficulty curve
  const levelProgress = Math.pow(compositeScore / 100, 1.3);
  
  const scale = (d === "bouldering") ? BOULDER_GRADES : SPORT_GRADES;
  const index = Math.floor(levelProgress * (scale.length - 1));
  
  return {
    grade: scale[index],
    score: Math.round(compositeScore)
  };
}

export default function ProfilePage() {
  const { data: profile, isLoading, isError } = useProfile()
  const [isKeywordModalOpen, setIsKeywordModalOpen] = useState(false)

  const quizGradeResult = useMemo(() => {
    if (!profile) return null;
    return calculateQuizGrade(profile.radar_chart, profile.preferences.primary_discipline);
  }, [profile]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse text-xl font-medium">Aggregating skill data...</p>
      </div>
    )
  }

  if (isError || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        < Zap className="w-12 h-12 text-destructive" />
        <p className="text-xl font-bold">Failed to load profile</p>
        <Button onClick={() => window.location.reload()} variant="outline">Retry Fetch</Button>
      </div>
    )
  }

  const radarData = Object.entries(profile.radar_chart).map(([subject, value]) => ({
    subject: subject.charAt(0).toUpperCase() + subject.slice(1).replace("_", " "),
    A: value,
    fullMark: 100,
  }))

  return (
    <>
    <div className="max-w-6xl mx-auto pt-6 pb-16 px-6 animate-in fade-in slide-in-from-bottom-6 duration-1000 space-y-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-bold border border-primary/20">
            <Mountain className="w-4 h-4" />
            <span>Active Climber ID: {profile.user_id.slice(0, 8)}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
            Performance Dashboard
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-2xl leading-relaxed">
            A real-time visualization of your current strengths, growth trajectory, and achievements.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <Button variant="outline" size="lg" className="flex-1 md:flex-none rounded-2xl h-14 border-white/5 bg-white/5 backdrop-blur-xl">Edit Preferences</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Skill Radar Chart */}
        <Card className="lg:col-span-7 border-none bg-card/40 backdrop-blur-xl shadow-2xl ring-1 ring-white/10 overflow-hidden min-h-[500px]">
          <CardHeader className="relative pb-0 pt-8 px-8">
            <div className="absolute top-0 right-0 p-8 text-primary/10">
              <TrendingUp className="w-32 h-32" />
            </div>
            <CardTitle className="text-2xl font-black tracking-tighter">SKILL QUINTESSENCE</CardTitle>
            <CardDescription className="font-medium text-muted-foreground italic">Current calibrated performance vectors</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] md:h-[400px] w-full p-0 relative">
            {profile.status === "updating" && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px] animate-fade-in">
                <Loader2 className="w-10 h-10 animate-spin text-primary mb-3" />
                <p className="text-primary font-black tracking-widest text-xs uppercase italic drop-shadow-lg">Re-indexing knowledge...</p>
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
                <PolarAngleAxis
                  dataKey="subject"
                  tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 13, fontWeight: 700 }}
                />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar
                   name="Skills"
                   dataKey="A"
                   stroke="var(--primary)"
                   fill="var(--primary)"
                   fillOpacity={0.4}
                   strokeWidth={3}
                   dot={{ r: 4, fillOpacity: 1 }}
                   isAnimationActive={false}
                 />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* User Preferences & Quick Stats */}
        <div className="lg:col-span-5 space-y-8">
          {/* Quiz Verified Grade */}
          <Card className="border-none bg-gradient-to-br from-indigo-500/20 to-primary/10 backdrop-blur-xl shadow-2xl ring-1 ring-white/20 overflow-hidden relative border-l-4 border-indigo-500">
            <CardContent className="p-8 pb-4">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 text-indigo-400 mb-1">
                    <ShieldCheck className="w-5 h-5" />
                    <span className="text-[10px] font-black tracking-[0.2em] uppercase italic">Verified Grade</span>
                  </div>
                  <h3 className="text-4xl font-black tracking-tighter text-white uppercase italic">
                    {quizGradeResult?.grade}
                  </h3>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Skill Score</p>
                  <p className="text-2xl font-black text-indigo-400">{quizGradeResult?.score}%</p>
                </div>
              </div>
              <div className="space-y-3">
                 <p className="text-sm font-medium text-muted-foreground leading-relaxed">
                   Calculated using weightings for <span className="text-white font-bold capitalize">{profile.preferences.primary_discipline}</span> discipline.
                 </p>
                 <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-1000" 
                      style={{ width: `${quizGradeResult?.score}%` }}
                    />
                 </div>
              </div>
            </CardContent>
            <div className="px-8 py-3 bg-indigo-500/10 border-t border-indigo-500/20">
              <p className="text-[10px] font-black tracking-widest text-indigo-400 uppercase italic">Skill Dashboard: Quiz Grade</p>
            </div>
          </Card>

          {/* User Claimed Grade & Preference Info */}
          <Card className="border-none bg-card/40 backdrop-blur-xl shadow-2xl ring-1 ring-white/10 p-2 overflow-hidden">
            <CardContent className="pt-6 grid grid-cols-2 gap-4 pb-4">
              <div className="bg-white/5 rounded-2xl p-5 border border-white/5 col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-widest flex items-center gap-2">
                      <Target className="w-3 h-3" /> Baseline Level
                    </p>
                    <p className="text-2xl font-black uppercase text-white">{profile.preferences.current_grade}</p>
                  </div>
                  <div className="bg-white/5 px-3 py-1 rounded-full border border-white/10">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase italic px-1">Self-reported</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-widest">Discipline</p>
                <p className="text-xl font-bold capitalize">{profile.preferences.primary_discipline}</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-widest">Environment</p>
                <p className="text-xl font-bold capitalize">{profile.preferences.indoor_vs_outdoor?.replace("_", " ")}</p>
              </div>
              
              <div className="bg-primary/10 rounded-2xl p-5 border border-primary/20 col-span-2">
                <p className="text-xs font-bold text-primary mb-1 uppercase tracking-widest">Main Goal</p>
                <p className="text-xl font-black capitalize text-primary">{profile.preferences.goal?.replace("_", " ")}</p>
              </div>
            </CardContent>
            <div className="px-6 py-3 bg-white/5 border-t border-white/5">
              <p className="text-[10px] font-black tracking-widest text-muted-foreground uppercase italic">Profile Baseline: Climbing Grade</p>
            </div>
          </Card>
        </div>
      </div>

    </div>
    {isKeywordModalOpen && (
      <KeywordSelector onClose={() => setIsKeywordModalOpen(false)} />
    )}
    </>
  )
}

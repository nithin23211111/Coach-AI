'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts'
import Navbar from '@/components/navbar'
import { useAccessControl } from '@/hooks/use-access-control'
import { formatINR } from '@/lib/industry-insights-utils'

export default function DashboardPage() {
  const { loading, isAuthenticated, usage, limits } = useAccessControl()
  const [historyData, setHistoryData] = useState<{
    interviews: any[]
    roadmaps: any[]
    resumeCount: number
    savedInsights: any[]
  }>({
    interviews: [],
    roadmaps: [],
    resumeCount: 0,
    savedInsights: [],
  })

  const interviewHistory = [
    ...(historyData.interviews.length > 0
      ? historyData.interviews.map((item) => ({
          id: item.id,
          date: item.created_at,
          score: item.overall_score ?? 0,
          role: 'Interview Session',
          mode: item.mode,
        }))
      : [
          { id: 1, date: '2026-02-15', score: 85, role: 'Frontend Developer', mode: 'Realistic' },
          { id: 2, date: '2026-02-10', score: 78, role: 'Full Stack Developer', mode: 'Coaching' },
          { id: 3, date: '2026-02-05', score: 92, role: 'Software Engineer', mode: 'Realistic' },
        ]),
  ]

  const performanceData = useMemo(() => {
    if (historyData.interviews.length === 0) {
      return [
        { week: 'Week 1', score: 74 },
        { week: 'Week 2', score: 80 },
        { week: 'Week 3', score: 83 },
        { week: 'Week 4', score: 88 },
      ]
    }

    return historyData.interviews.slice(0, 6).reverse().map((item, index) => ({
      week: `S${index + 1}`,
      score: item.overall_score ?? 0,
    }))
  }, [historyData.interviews])

  useEffect(() => {
    if (!isAuthenticated) {
      setHistoryData({
        interviews: [],
        roadmaps: [],
        resumeCount: 0,
        savedInsights: [],
      })
      return
    }

    const loadHistory = async () => {
      try {
        const response = await fetch('/api/dashboard/history')
        if (!response.ok) return
        const data = await response.json()
        setHistoryData({
          interviews: data.interviews ?? [],
          roadmaps: data.roadmaps ?? [],
          resumeCount: data.resumeCount ?? 0,
          savedInsights: data.savedInsights ?? [],
        })
      } catch (error) {
        console.error('Failed to load dashboard history:', error)
      }
    }

    loadHistory()
  }, [isAuthenticated])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">Loading...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            {isAuthenticated
              ? 'Long-term coaching history, progress graphs, and saved outputs.'
              : 'Session-only analytics. Sign up to save your history and unlock premium limits.'}
          </p>
        </div>

        {!isAuthenticated && (
          <Card className="border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">Sign up to save progress</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Guest limits use rolling 5-hour windows. Create an account to unlock persistent interview history and confidence tracking.
            </p>
            <Button asChild>
              <Link href="/auth/signup">Create Account</Link>
            </Button>
          </Card>
        )}

        <div className="grid md:grid-cols-4 gap-6">
          <Card className="p-6">
            <p className="text-sm font-semibold text-muted-foreground mb-2">Interview Sessions</p>
            <p className="text-3xl font-bold text-foreground">
              {isAuthenticated ? 'Unlimited' : `${usage.interview_sessions}/${limits.interview_sessions}`}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-sm font-semibold text-muted-foreground mb-2">SkillLens Roadmaps</p>
            <p className="text-3xl font-bold text-foreground">
              {isAuthenticated ? 'Unlimited' : `${usage.skilllens_roadmaps}/${limits.skilllens_roadmaps}`}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-sm font-semibold text-muted-foreground mb-2">Industry Insights</p>
            <p className="text-3xl font-bold text-foreground">
              {isAuthenticated ? 'Unlimited' : `${usage.industry_insights}/${limits.industry_insights}`}
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-sm font-semibold text-muted-foreground mb-2">Resume Downloads</p>
            <p className="text-3xl font-bold text-foreground">
              {isAuthenticated ? historyData.resumeCount : `${usage.resume_downloads}/${limits.resume_downloads}`}
            </p>
          </Card>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                {isAuthenticated ? 'History' : 'Session Overview'}
              </h2>
              {isAuthenticated ? (
                <div className="space-y-4">
                  {interviewHistory.map((interview) => (
                    <div key={interview.id} className="flex items-center justify-between p-4 border border-border rounded-lg">
                      <div>
                        <p className="font-semibold text-foreground">{interview.role}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(interview.date).toLocaleDateString()} | {interview.mode}
                        </p>
                      </div>
                      <p className="text-2xl font-bold text-primary">{interview.score}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Guest mode does not keep persistent interview history. Your graphs and scores are temporary.
                </p>
              )}
              <Button asChild variant="outline" className="w-full mt-4">
                <Link href="/interview">Start Interview</Link>
              </Button>
            </Card>

            <Card className="p-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">Confidence Improvement Graph</h2>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="week" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="score" fill="var(--primary)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              {!isAuthenticated && (
                <p className="mt-3 text-xs text-muted-foreground">
                  This graph is session-only in Guest mode.
                </p>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Saved SkillLens Roadmaps</h3>
              {isAuthenticated ? (
                <div className="space-y-3">
                  {historyData.roadmaps.length === 0 && (
                    <p className="text-sm text-muted-foreground">No saved analyses yet. Generate one in SkillLens.</p>
                  )}
                  {historyData.roadmaps.slice(0, 4).map((roadmap) => {
                    const targetRole = roadmap.target_role || roadmap.role_id || 'Target role'
                    const skills = Array.isArray(roadmap.current_skills) ? roadmap.current_skills.slice(0, 3).join(', ') : 'Skills not available'
                    const createdAt = roadmap.analysis_generated_at || roadmap.created_at
                    return (
                      <div key={roadmap.id} className="rounded-lg border border-border p-3">
                        <p className="text-sm font-semibold text-foreground">{targetRole}</p>
                        <p className="text-xs text-muted-foreground mt-1">{skills}</p>
                        <p className="text-xs text-muted-foreground mt-1">{new Date(createdAt).toLocaleString()}</p>
                      </div>
                    )
                  })}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Roadmap Completion Index</span>
                      <span>{Math.min(100, historyData.roadmaps.length * 10)}%</span>
                    </div>
                    <Progress value={Math.min(100, historyData.roadmaps.length * 10)} />
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sign up to save your roadmap progress over time.</p>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-bold text-foreground mb-4">Saved Insights</h3>
              {isAuthenticated ? (
                <div className="space-y-3">
                  {historyData.savedInsights.length === 0 && (
                    <p className="text-sm text-muted-foreground">No saved insights yet. Save a snapshot from Industry Insights.</p>
                  )}
                  {historyData.savedInsights.slice(0, 4).map((insight) => (
                    <div key={insight.id} className="rounded-lg border border-border p-3">
                      <p className="text-sm font-semibold text-foreground">{insight.industry_name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Growth +{Number(insight.growth_rate ?? 0).toLocaleString('en-IN')}% | Demand {insight.demand_level}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Avg Salary {formatINR(Number(insight.avg_salary ?? 0))} | Confidence {Number(insight.confidence_score ?? 0)}%
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(insight.created_at).toLocaleString('en-IN')}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sign up to store and review saved insights snapshots.</p>
              )}
            </Card>

            <Card className="p-6 space-y-3">
              <h3 className="text-lg font-bold text-foreground mb-4">Quick Actions</h3>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/resume">Resume Builder</Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start">
                <Link href="/skilllens">SkillLens</Link>
              </Button>
              {isAuthenticated && (
                <Button asChild variant="outline" className="w-full justify-start">
                  <Link href="/insights">Industry Insights</Link>
                </Button>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

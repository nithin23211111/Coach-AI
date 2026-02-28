'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Line, LineChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart'
import { RoleCombobox, type RoleOption } from '@/components/role-combobox'
import { useAccessControl } from '@/hooks/use-access-control'
import { LimitReachedModal } from '@/components/limit-reached-modal'
import { supabase } from '@/lib/supabase'

type PerformanceTrendPoint = {
  sessionId: string
  score: number
  createdAt: string
  progress: number
}

type InterviewAnalytics = {
  averageScore: number
  latestScore: number
  progressPercentage: number
  commonWeaknesses: { label: string; count: number }[]
  focusAreas: string[]
}

type InterviewMode = 'standard' | 'timed'

type InterviewCoachFunctionResponse = {
  success?: boolean
  message?: string
  error?: string
}

const CAREER_PATH_OPTIONS = [
  'Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'Data Scientist',
  'AI/ML Engineer',
  'Product Manager',
  'UI/UX Designer',
  'DevOps Engineer',
] as const

const INTERVIEW_ROLE_OPTIONS: RoleOption[] = [
  ...CAREER_PATH_OPTIONS.map((role) => ({ value: role, label: role })),
  { value: '__other__', label: 'Other (Type your role)' },
]

function isNetworkFailure(error: unknown) {
  if (!(error instanceof Error)) return false
  const message = error.message.toLowerCase()
  return message.includes('failed to fetch')
    || message.includes('network')
    || message.includes('authretryablefetcherror')
}

export function InterviewCoachClient() {
  const router = useRouter()
  const [startingMode, setStartingMode] = useState<InterviewMode | null>(null)
  const [interviewError, setInterviewError] = useState('')
  const [interviewResponseMessage, setInterviewResponseMessage] = useState('')
  const [generatedQuestions, setGeneratedQuestions] = useState<string[]>([])
  const [selectedRoleOption, setSelectedRoleOption] = useState<string>('')
  const [customRole, setCustomRole] = useState('')
  const [performanceTrend, setPerformanceTrend] = useState<PerformanceTrendPoint[]>([])
  const [analytics, setAnalytics] = useState<InterviewAnalytics | null>(null)
  const [performanceLoading, setPerformanceLoading] = useState(false)

  const {
    loading,
    isAuthenticated,
    usage,
    limits,
    consume,
    limitReachedFeature,
    closeLimitModal,
  } = useAccessControl()

  useEffect(() => {
    if (!isAuthenticated) {
      setPerformanceTrend([])
      setAnalytics(null)
      return
    }

    const fetchPerformance = async () => {
      setPerformanceLoading(true)
      try {
        const response = await fetch('/api/interview/performance')
        if (!response.ok) return
        const data = await response.json()
        setPerformanceTrend(Array.isArray(data?.trend) ? data.trend : [])
        setAnalytics(data?.analytics || null)
      } catch (error) {
        console.error('Failed to load interview performance:', error)
      } finally {
        setPerformanceLoading(false)
      }
    }

    void fetchPerformance()
  }, [isAuthenticated])

  const handleStartInterview = async (selectedType: InterviewMode) => {
    if (startingMode !== null) return

    const selectedRole =
      selectedRoleOption === '__other__'
        ? customRole.trim()
        : selectedRoleOption.trim()

    if (!selectedRole) {
      setInterviewError('Please select or enter a role before starting the interview.')
      return
    }

    setInterviewError('')
    setInterviewResponseMessage('')
    setGeneratedQuestions([])
    setStartingMode(selectedType)

    try {
      if (loading) {
        setInterviewError('Checking your session. Please try again.')
        return
      }

      const { data: sessionData } = await supabase.auth.getSession()

      if (!sessionData.session) {
        const canUseGuestInterview = await consume('interview_sessions')
        if (!canUseGuestInterview) {
          router.push('/auth/login')
          return
        }
      }

      const { data, error } = await supabase.functions.invoke<InterviewCoachFunctionResponse>(
        'interview-coach',
        {
          body: {
            role: selectedRole,
            type: selectedType,
          },
        },
      )

      if (error) {
        setInterviewError(error.message || 'Failed to start interview.')
        return
      }

      if (data?.success === true) {
        setInterviewResponseMessage(
          typeof data.message === 'string' && data.message.trim()
            ? data.message
            : 'Interview started successfully.',
        )
        return
      }

      if (typeof data?.error === 'string' && data.error.trim()) {
        setInterviewError(data.error)
        return
      }

      setInterviewError('Unexpected response from interview service.')
    } catch (err) {
      console.error('Failed to start interview:', err)

      const message =
        err instanceof Error && err.message.trim()
          ? err.message
          : isNetworkFailure(err)
            ? 'Unable to reach interview service right now. Please check your network and try again.'
            : 'Unable to start interview session.'

      setInterviewError(message)
    } finally {
      setStartingMode(null)
    }
  }

  const chartData = useMemo(
    () =>
      performanceTrend.map((point, index) => ({
        label: `S${index + 1}`,
        score: point.score,
      })),
    [performanceTrend],
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0b15] to-[#0e0e1a]">
      <nav className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-foreground">Coach AI</span>
          </Link>
          <Button variant="ghost" asChild>
            <Link href="/">Back Home</Link>
          </Button>
        </div>
      </nav>

      <div className="relative z-10 mx-auto max-w-6xl px-6 py-12">
        {!isAuthenticated && (
          <Card className="mb-6 border-border bg-card p-4 text-foreground">
            <p className="text-sm font-medium">
              Guest usage this 24-hour window: {usage.interview_sessions}/{limits.interview_sessions} interview sessions.
            </p>
            <p className="text-xs text-muted-foreground">You can run 2 interview starts every 24 hours before login is required.</p>
          </Card>
        )}

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="space-y-3">
              <h1 className="text-4xl font-bold text-foreground">AI Interview Coach</h1>
              <p className="text-lg text-muted-foreground">Choose your role and start a tracked interview simulation.</p>
              <RoleCombobox
                options={INTERVIEW_ROLE_OPTIONS}
                value={selectedRoleOption || undefined}
                onChange={(value) => {
                  setSelectedRoleOption(value)
                  setInterviewError('')
                }}
                placeholder="Select or search role"
                className="z-20"
              />
              {selectedRoleOption === '__other__' && (
                <Input
                  className="bg-input text-foreground"
                  value={customRole}
                  onChange={(event) => {
                    setCustomRole(event.target.value)
                    setInterviewError('')
                  }}
                  placeholder="Enter your target role"
                />
              )}
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card className="cursor-pointer border-2 p-6 transition-all hover:border-primary">
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-foreground">Standard Interview</h3>
                  <p className="text-sm text-muted-foreground">Adaptive full-session practice with detailed feedback.</p>
                  <Button type="button" onClick={() => void handleStartInterview('standard')} className="w-full" disabled={startingMode !== null}>
                    {startingMode === 'standard' ? 'Starting...' : 'Start Standard'}
                  </Button>
                </div>
              </Card>

              <Card className="cursor-pointer border-2 p-6 transition-all hover:border-primary">
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-foreground">Timed Simulation</h3>
                  <p className="text-sm text-muted-foreground">120-second pressure mode to improve concise delivery.</p>
                  <Button type="button" onClick={() => void handleStartInterview('timed')} className="w-full" disabled={startingMode !== null}>
                    {startingMode === 'timed' ? 'Starting...' : 'Start Timed'}
                  </Button>
                </div>
              </Card>
            </div>

            {interviewError ? <p className="text-sm text-red-400">{interviewError}</p> : null}
            {interviewResponseMessage ? <p className="text-sm text-emerald-300">{interviewResponseMessage}</p> : null}

            {generatedQuestions.length > 0 && (
              <Card className="space-y-3 border-border p-4">
                <h3 className="text-lg font-semibold text-foreground">Generated Questions</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  {generatedQuestions.map((question, index) => (
                    <li key={`${index + 1}-${question}`}>{index + 1}. {question}</li>
                  ))}
                </ul>
              </Card>
            )}
          </div>

          <Card className="space-y-5 p-6">
            <h2 className="text-xl font-semibold text-foreground">Performance Dashboard</h2>
            {!isAuthenticated ? (
              <p className="text-sm text-muted-foreground">Login required for session history and progress analytics.</p>
            ) : performanceLoading ? (
              <p className="text-sm text-muted-foreground">Loading performance...</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="text-xs text-muted-foreground">Average</p>
                    <p className="text-2xl font-semibold text-foreground">{Math.round(analytics?.averageScore || 0)}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="text-xs text-muted-foreground">Latest</p>
                    <p className="text-2xl font-semibold text-foreground">{Math.round(analytics?.latestScore || 0)}</p>
                  </div>
                  <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                    <p className="text-xs text-muted-foreground">Progress</p>
                    <p className="text-2xl font-semibold text-foreground">{(analytics?.progressPercentage || 0).toFixed(1)}%</p>
                  </div>
                </div>

                {chartData.length > 0 ? (
                  <ChartContainer
                    className="h-[220px] w-full"
                    config={{
                      score: { label: 'Score', color: 'hsl(var(--primary))' },
                    }}
                  >
                    <LineChart data={chartData} margin={{ left: 8, right: 8, top: 10, bottom: 4 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="label" tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} tickLine={false} axisLine={false} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Line dataKey="score" type="monotone" stroke="var(--color-score)" strokeWidth={2.5} dot={{ r: 3 }} />
                    </LineChart>
                  </ChartContainer>
                ) : (
                  <p className="text-sm text-muted-foreground">Complete at least one session to view score trends.</p>
                )}

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">Common Weaknesses</h3>
                  {(analytics?.commonWeaknesses || []).length ? (
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {(analytics?.commonWeaknesses || []).map((item) => (
                        <li key={item.label}>{item.label} ({item.count})</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No weakness trends yet.</p>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-foreground">Learning Focus Areas</h3>
                  {(analytics?.focusAreas || []).length ? (
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      {(analytics?.focusAreas || []).map((item, index) => (
                        <li key={`${item}-${index}`}>{item}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">Session tips will appear here after completion.</p>
                  )}
                </div>
              </>
            )}
          </Card>
        </div>
      </div>

      <LimitReachedModal
        open={Boolean(limitReachedFeature)}
        feature={limitReachedFeature}
        onOpenChange={(open) => {
          if (!open) closeLimitModal()
        }}
      />
    </div>
  )
}

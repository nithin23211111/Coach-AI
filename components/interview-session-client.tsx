'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useAccessControl } from '@/hooks/use-access-control'
import { LimitReachedModal } from '@/components/limit-reached-modal'

type InterviewSessionClientProps = {
  sessionId: string
}

type SessionPayload = {
  id: string
  role: string
  mode: 'standard' | 'timed'
  total_questions: number
  current_question_number: number
  difficulty_level: string
}

export function InterviewSessionClient({ sessionId }: InterviewSessionClientProps) {
  const router = useRouter()
  const [session, setSession] = useState<SessionPayload | null>(null)
  const [sessionLoading, setSessionLoading] = useState(true)
  const [inputMode, setInputMode] = useState<'text' | 'voice'>('text')
  const [currentQuestion, setCurrentQuestion] = useState('Tell me about yourself and your professional background.')
  const [userAnswer, setUserAnswer] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const [questionIndex, setQuestionIndex] = useState(0)
  const [scores, setScores] = useState<any>(null)
  const [feedback, setFeedback] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const [interviewError, setInterviewError] = useState('')
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null)
  const [currentDifficulty, setCurrentDifficulty] = useState('medium')
  const [timeLeft, setTimeLeft] = useState(120)
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now())
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false)
  const [hasSavedPerformance, setHasSavedPerformance] = useState(false)

  const {
    isAuthenticated,
    openLimitModal,
    limitReachedFeature,
    closeLimitModal,
  } = useAccessControl()

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  useEffect(() => {
    const loadSession = async () => {
      setSessionLoading(true)
      setInterviewError('')

      try {
        if (!sessionId?.trim()) {
          setInterviewError('Invalid interview session.')
          return
        }

        const response = await fetch(`/api/interview/session/${sessionId}`)
        if (!response.ok) {
          setInterviewError('Unable to load interview session.')
          return
        }

        const data = await response.json()
        const loadedSession = data?.session as SessionPayload | undefined
        if (!loadedSession?.id) {
          setInterviewError('Unable to load interview session.')
          return
        }

        setSession(loadedSession)
        setCurrentDifficulty(loadedSession.difficulty_level || 'medium')
        setQuestionIndex(Math.max(0, (loadedSession.current_question_number || 1) - 1))
      } catch (error) {
        console.error('Failed to load interview session:', error)
        setInterviewError('Unable to load interview session.')
      } finally {
        setSessionLoading(false)
      }
    }

    void loadSession()
  }, [router, sessionId])

  const loadInterviewQuestion = async (questionNumber: number) => {
    if (!session) return null
    const sessionType: 'full' | 'timed' = session.mode === 'timed' ? 'timed' : 'full'

    for (const attempt of [0, 1]) {
      try {
        const response = await fetch('/api/interview/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId: session.id,
            mode: session.mode,
            role: session.role,
            category: 'mixed',
            difficulty: currentDifficulty || 'medium',
            sessionType,
            questionNumber,
            totalQuestions: session.total_questions,
          }),
        })

        let responseJson: Record<string, unknown> | null = null
        try {
          const parsed = await response.json()
          responseJson = parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : null
        } catch (parseError) {
          console.error('Failed to parse /api/interview/generate response JSON:', parseError)
          responseJson = null
        }

        if (response.status === 429) {
          console.error('Interview question generation rate limited response:', responseJson)
          openLimitModal('interview_sessions')
          return null
        }

        if (!response.ok) {
          const apiError =
            typeof responseJson?.error === 'string' && responseJson.error.trim()
              ? responseJson.error.trim()
              : ''
          const apiDetails =
            typeof responseJson?.details === 'string' && responseJson.details.trim()
              ? responseJson.details.trim()
              : ''
          const message = apiDetails || apiError || `Request failed with status ${response.status}`
          const responseBodyText = responseJson ? JSON.stringify(responseJson) : 'null'
          console.error(
            `Interview question generation API error response: status=${response.status} attempt=${attempt} message=${message} body=${responseBodyText}`
          )
          if (attempt === 1) {
            throw new Error(message)
          }
          continue
        }

        const question =
          typeof responseJson?.question === 'string'
            ? responseJson.question.trim()
            : ''
        if (!question) {
          console.error('Interview question generation response missing question field:', responseJson)
          if (attempt === 1) {
            throw new Error('Invalid API response')
          }
          continue
        }

        return {
          question,
          historyId:
            typeof responseJson?.historyId === 'string'
              ? responseJson.historyId
              : null,
          difficulty:
            typeof responseJson?.difficulty === 'string'
              ? responseJson.difficulty
              : currentDifficulty,
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.error(`Interview question generation request failed: attempt=${attempt} message=${message}`)
        if (attempt === 1) {
          setInterviewError(message || 'Unable to generate question. Please try again.')
          return null
        }
      }
    }

    return null
  }

  useEffect(() => {
    if (sessionLoading || !session || currentHistoryId) return

    const initQuestion = async () => {
      setIsLoading(true)
      try {
        const nextQuestionNumber = Math.max(1, session.current_question_number + 1)
        const next = await loadInterviewQuestion(nextQuestionNumber)
        if (!next?.question) {
          setInterviewError('Unable to generate question. Please try again.')
          return
        }

        setCurrentQuestion(next.question)
        setCurrentHistoryId(next.historyId)
        setCurrentDifficulty(next.difficulty || currentDifficulty)
        setQuestionIndex(nextQuestionNumber - 1)
        setQuestionStartTime(Date.now())
        setTimeLeft(120)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        console.error('Failed to initialize interview question:', { message, error })
        setInterviewError(message || 'Unable to generate question. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }

    void initQuestion()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionLoading, session, currentHistoryId])

  useEffect(() => {
    if (!session || session.mode !== 'timed' || isLoading || isAutoSubmitting || Boolean(scores)) return

    if (timeLeft <= 0) {
      void evaluateAnswer(true)
      return
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => clearTimeout(timer)
  }, [timeLeft, session, isLoading, isAutoSubmitting, scores])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        setUserAnswer('(Transcribed from audio)')
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Error accessing microphone:', error)
    }
  }

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return
    mediaRecorderRef.current.stop()
    setIsRecording(false)
  }

  const evaluateAnswer = async (autoSubmit = false) => {
    if (!session) return
    const normalizedAnswer = userAnswer.trim()
    if (!autoSubmit && !normalizedAnswer) {
      alert('Please provide an answer')
      return
    }

    if (!currentHistoryId) {
      setInterviewError('Unable to submit answer. Please reload the interview session.')
      return
    }

    const elapsedSeconds =
      session.mode === 'timed'
        ? Math.max(0, 120 - timeLeft)
        : Math.max(0, Math.round((Date.now() - questionStartTime) / 1000))

    if (autoSubmit) {
      setIsAutoSubmitting(true)
    }

    setIsLoading(true)
    setInterviewError('')
    try {
      const response = await fetch('/api/interview/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQuestion,
          answer: normalizedAnswer || '(No answer submitted)',
          mode: 'realistic',
          sessionId: session.id,
          historyId: currentHistoryId,
          timeTaken: elapsedSeconds,
          questionNumber: questionIndex + 1,
          totalQuestions: session.total_questions,
        }),
      })

      if (!response.ok) {
        setInterviewError('Unable to evaluate answer. Please try again.')
        return
      }

      const data = await response.json()
      setScores(data.scores)
      setFeedback(data.feedback)

      const isFinalQuestion = questionIndex >= (session.total_questions - 1)
      if (isAuthenticated && isFinalQuestion && !hasSavedPerformance) {
        const clarity = Number(data?.scores?.clarity ?? data?.scores?.communication ?? 0)
        const technical = Number(data?.scores?.technicalDepth ?? data?.scores?.technical ?? 0)
        const structure = Number(data?.scores?.structure ?? data?.scores?.problemSolving ?? 0)
        const confidence = Number(data?.scores?.confidence ?? data?.scores?.leadership ?? 0)
        const overall = Math.round((clarity * 0.3) + (technical * 0.35) + (structure * 0.2) + (confidence * 0.15))

        const metricRows = [
          { label: 'Clarity', value: clarity },
          { label: 'Technical Depth', value: technical },
          { label: 'Structure', value: structure },
          { label: 'Confidence', value: confidence },
        ]
        const strengths = Array.isArray(data?.strengths) && data.strengths.length
          ? data.strengths.map((item: unknown) => String(item).trim()).filter(Boolean).slice(0, 8)
          : metricRows.filter((metric) => metric.value >= 75).map((metric) => metric.label)
        const weaknesses = Array.isArray(data?.weaknesses) && data.weaknesses.length
          ? data.weaknesses.map((item: unknown) => String(item).trim()).filter(Boolean).slice(0, 8)
          : metricRows.filter((metric) => metric.value < 65).map((metric) => metric.label)
        const improvementTips = String(data?.improvement_tips || data?.feedback || '').trim().slice(0, 1000)

        void fetch('/api/interview/performance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            session_id: session.id,
            role: session.role,
            overall_score: overall,
            clarity_score: clarity,
            technical_score: technical,
            structure_score: structure,
            confidence_score: confidence,
            strengths,
            weaknesses,
            improvement_tips: improvementTips,
          }),
        })
        setHasSavedPerformance(true)
      }
    } catch (error) {
      console.error('Failed to evaluate interview answer:', error)
      setInterviewError('Unable to evaluate answer. Please try again.')
    } finally {
      setIsLoading(false)
      setIsAutoSubmitting(false)
    }
  }

  const nextQuestion = async () => {
    if (!session) return
    if (questionIndex >= session.total_questions - 1) {
      alert('Interview complete! Review your performance above.')
      return
    }

    setIsLoading(true)
    setInterviewError('')
    try {
      const next = await loadInterviewQuestion(questionIndex + 2)
      if (!next) {
        setInterviewError('Unable to generate question. Please try again.')
        return
      }

      setCurrentQuestion(next.question)
      setCurrentHistoryId(next.historyId)
      setCurrentDifficulty(next.difficulty || currentDifficulty)
      setQuestionIndex((prev) => prev + 1)
      setUserAnswer('')
      setScores(null)
      setFeedback('')
      setTimeLeft(120)
      setQuestionStartTime(Date.now())
    } catch (error) {
      console.error('Failed to load next interview question:', error)
      setInterviewError('Unable to generate question. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const endInterview = () => {
    router.push('/interview')
  }

  const performanceData = [
    { name: 'Clarity', value: scores?.clarity ?? scores?.communication ?? 0 },
    { name: 'Technical', value: scores?.technicalDepth ?? scores?.technical ?? 0 },
    { name: 'Structure', value: scores?.structure ?? scores?.problemSolving ?? 0 },
    { name: 'Confidence', value: scores?.confidence ?? scores?.leadership ?? 0 },
  ]

  if (sessionLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0b0b15] to-[#0e0e1a]">
        <div className="relative z-10 mx-auto max-w-5xl px-6 py-12">
          <p className="text-sm text-muted-foreground">Loading interview session...</p>
        </div>
      </div>
    )
  }

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

      <div className="relative z-10 mx-auto max-w-5xl px-6 py-12">
        {interviewError ? <p className="mb-4 text-sm text-red-400">{interviewError}</p> : null}
        {!isAuthenticated ? (
          <p className="mb-4 text-sm text-muted-foreground">
            Guest mode enabled: you can practice interviews, but performance history and trends are saved only for logged-in users.
          </p>
        ) : null}
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Interview Session</h1>
              <p className="mt-1 text-muted-foreground">
                Question {questionIndex + 1} of {session?.total_questions ?? 12} | Role: {session?.role || 'Software Engineer'}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge variant="outline">{session?.mode === 'standard' ? 'Standard' : 'Timed'}</Badge>
              {session?.mode === 'timed' && <Badge variant="outline">{timeLeft}s</Badge>}
              <Button variant="outline" onClick={endInterview}>
                End Session
              </Button>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Card className="p-6">
                <h3 className="mb-3 text-sm font-semibold text-muted-foreground">Current Question</h3>
                <p className="text-xl font-semibold leading-relaxed text-foreground">{currentQuestion}</p>
              </Card>

              <Tabs value={inputMode} onValueChange={(val) => setInputMode(val as 'text' | 'voice')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="text">Text Input</TabsTrigger>
                  <TabsTrigger value="voice">Voice Input</TabsTrigger>
                </TabsList>

                <TabsContent value="text" className="space-y-4">
                  <Textarea
                    placeholder="Type your answer here..."
                    value={userAnswer}
                    onChange={(e) => setUserAnswer(e.target.value)}
                    rows={6}
                    className="resize-none"
                  />
                </TabsContent>

                <TabsContent value="voice" className="space-y-4">
                  <div className="rounded-lg border-2 border-dashed border-border p-8 text-center">
                    {!isRecording ? (
                      <Button onClick={startRecording} size="lg" className="w-full">
                        Start Recording
                      </Button>
                    ) : (
                      <Button onClick={stopRecording} size="lg" variant="destructive" className="w-full">
                        Stop Recording
                      </Button>
                    )}
                    {userAnswer && <p className="mt-4 text-sm text-muted-foreground">{userAnswer}</p>}
                  </div>
                </TabsContent>
              </Tabs>

              <Button onClick={() => void evaluateAnswer(false)} size="lg" className="w-full" disabled={isLoading || !userAnswer}>
                {isLoading ? 'Evaluating...' : 'Submit Answer'}
              </Button>

              {scores && (
                <div className="flex justify-end">
                  <Button onClick={nextQuestion} size="sm" variant="outline" disabled={isLoading}>
                    {questionIndex < (session?.total_questions ?? 12) - 1 ? 'Next Question' : 'View Summary'}
                  </Button>
                </div>
              )}
            </div>

            <div className="space-y-6">
              {scores && (
                <>
                  <Card className="p-6">
                    <h3 className="mb-4 text-lg font-semibold text-foreground">Overall Score</h3>
                    <div className="mb-2 text-5xl font-bold text-primary">
                      {Math.round(
                        (
                          ((scores?.clarity ?? scores?.communication ?? 0) * 0.3) +
                          ((scores?.technicalDepth ?? scores?.technical ?? 0) * 0.35) +
                          ((scores?.structure ?? scores?.problemSolving ?? 0) * 0.2) +
                          ((scores?.confidence ?? scores?.leadership ?? 0) * 0.15)
                        ),
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">/100</p>
                  </Card>

                  {feedback && (
                    <Card className="p-6">
                      <h3 className="mb-3 text-lg font-semibold text-foreground">Feedback</h3>
                      <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{feedback}</p>
                    </Card>
                  )}
                </>
              )}

              {scores && (
                <Card className="p-6">
                  <h3 className="mb-4 text-lg font-semibold text-foreground">Performance</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Bar dataKey="value" fill="var(--primary)" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              )}
            </div>
          </div>
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

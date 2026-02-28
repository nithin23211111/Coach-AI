'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

type PerformanceRecord = {
  id: string
  role: string | null
  overall_score: number | null
  weaknesses: string[] | null
  improvement_tips: string | null
  created_at: string
}

type PerformanceDashboardClientProps = {
  records: PerformanceRecord[]
}

export default function PerformanceDashboardClient({ records }: PerformanceDashboardClientProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const chartData = useMemo(
    () =>
      records.map((record, index) => ({
        label: `S${index + 1}`,
        date: new Date(record.created_at).toLocaleDateString(),
        score: Number(record.overall_score || 0),
      })),
    [records],
  )

  const averageScore = useMemo(() => {
    if (!records.length) return 0
    const total = records.reduce((sum, record) => sum + Number(record.overall_score || 0), 0)
    return Math.round(total / records.length)
  }, [records])

  const weaknessFrequency = useMemo(() => {
    const frequency = new Map<string, number>()
    for (const record of records) {
      for (const weakness of record.weaknesses || []) {
        const label = String(weakness).trim()
        if (!label) continue
        frequency.set(label, (frequency.get(label) || 0) + 1)
      }
    }
    return Array.from(frequency.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([label, count]) => ({ label, count }))
      .slice(0, 6)
  }, [records])

  const improvementTrend = useMemo(() => {
    if (records.length < 2) return 0
    const first = Number(records[0].overall_score || 0)
    const latest = Number(records[records.length - 1].overall_score || 0)
    if (first <= 0) return 0
    return Number((((latest - first) / first) * 100).toFixed(2))
  }, [records])

  const latestTip = useMemo(() => {
    for (let index = records.length - 1; index >= 0; index -= 1) {
      const tip = String(records[index].improvement_tips || '').trim()
      if (tip) return tip
    }
    return 'Complete an interview session to generate personalized AI tips.'
  }, [records])

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0b15] to-[#0e0e1a] text-foreground">
      <nav className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-bold text-foreground">Coach AI</Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/interview">Start Interview</Link>
            </Button>
          </div>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Performance Dashboard</h1>
          <p className="mt-2 text-sm text-muted-foreground">Track interview score progression and focus areas over time.</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">Average Score</p>
            <p className="mt-2 text-4xl font-bold text-foreground">{averageScore}</p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">Improvement vs First Session</p>
            <p className={`mt-2 text-4xl font-bold ${improvementTrend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {improvementTrend >= 0 ? '+' : ''}{improvementTrend}%
            </p>
          </Card>
          <Card className="p-6">
            <p className="text-sm text-muted-foreground">Sessions Tracked</p>
            <p className="mt-2 text-4xl font-bold text-foreground">{records.length}</p>
          </Card>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-3">
          <Card className="lg:col-span-2 p-6">
            <h2 className="text-xl font-semibold text-foreground">Overall Score Progression</h2>
            <div className="mt-4 h-[320px]">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="label" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Loading chart...</div>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-xl font-semibold text-foreground">Most Common Weaknesses</h2>
            <div className="mt-4 space-y-2">
              {weaknessFrequency.length ? (
                weaknessFrequency.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 p-3">
                    <span className="text-sm text-foreground">{item.label}</span>
                    <span className="text-sm font-semibold text-muted-foreground">{item.count}</span>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No weakness data yet.</p>
              )}
            </div>
          </Card>
        </div>

        <Card className="mt-6 p-6">
          <h2 className="text-xl font-semibold text-foreground">Latest AI Improvement Tip</h2>
          <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{latestTip}</p>
        </Card>
      </div>
    </div>
  )
}

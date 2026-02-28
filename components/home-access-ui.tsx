'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import { useAccessControl } from '@/hooks/use-access-control'
import { getGuestInterviewUsageClient } from '@/lib/access-control'

function formatCountdown(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return [hours, minutes, seconds].map((value) => String(value).padStart(2, '0')).join(':')
}

export function HomeHeroUsage() {
  const { isAuthenticated, usage, limits, loading, guestInterviewLimitReached } = useAccessControl()
  const [remainingMs, setRemainingMs] = useState(0)

  useEffect(() => {
    if (loading || isAuthenticated || !guestInterviewLimitReached) {
      setRemainingMs(0)
      return
    }

    const updateCountdown = () => {
      const guestUsage = getGuestInterviewUsageClient()
      setRemainingMs(guestUsage.remainingMs)
    }

    updateCountdown()
    const intervalId = window.setInterval(updateCountdown, 1000)
    return () => window.clearInterval(intervalId)
  }, [guestInterviewLimitReached, isAuthenticated, loading])

  if (loading || isAuthenticated) return null

  return (
    <>
      <div className="inline-flex rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium text-muted-foreground">
        Current 24-hour window: Interviews {usage.interview_sessions}/{limits.interview_sessions ?? 2} | SkillLens {usage.skilllens_roadmaps}/{limits.skilllens_roadmaps ?? 2}
      </div>
      {guestInterviewLimitReached && (
        <div className="mt-2 inline-flex rounded-full border border-[#6B1F2A]/60 bg-[#6B1F2A]/15 px-4 py-1.5 text-xs font-semibold text-[#F3D2D8]">
          Interview limit reached. Resets in {formatCountdown(remainingMs)}
        </div>
      )}
    </>
  )
}

export function IndustryInsightsAction() {
  const { isAuthenticated } = useAccessControl()

  if (!isAuthenticated) {
    return (
      <Link href="/auth/login" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80">
        <Lock className="h-3.5 w-3.5" />
        Sign in to unlock
      </Link>
    )
  }

  return (
    <Link href="/insights" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80">
      View Insights
    </Link>
  )
}

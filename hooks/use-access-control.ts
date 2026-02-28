'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import {
  AUTH_LIMITS,
  consumeGuestInterviewAttemptClient,
  createEmptyUsage,
  getGuestInterviewUsageClient,
  getLimitForUser,
  GUEST_LIMITS,
  type FeatureKey,
  type UsageSnapshot,
} from '@/lib/access-control'
import { getGuestIdClient } from '@/lib/guest-id'

type ConsumeOptions = {
  metadata?: Record<string, unknown>
}

export function useAccessControl() {
  const [user, setUser] = useState<User | null>(null)
  const [usage, setUsage] = useState<UsageSnapshot>(createEmptyUsage())
  const [loading, setLoading] = useState(true)
  const [limitReachedFeature, setLimitReachedFeature] = useState<FeatureKey | null>(null)

  const refreshUsage = useCallback(async (isAuth: boolean) => {
    const guestId = !isAuth ? getGuestIdClient() : ''

    try {
      const response = await fetch('/api/access/usage', {
        method: 'GET',
        headers: guestId ? { 'x-guest-id': guestId } : undefined,
      })
      if (!response.ok) {
        if (!isAuth) {
          const guestInterview = getGuestInterviewUsageClient()
          setUsage((prev) => ({ ...prev, interview_sessions: guestInterview.count }))
        }
        return
      }
      const payload = await response.json()
      if (payload.usage) {
        setUsage((prev) => {
          const nextUsage = { ...prev, ...payload.usage }
          if (!isAuth) {
            const guestInterview = getGuestInterviewUsageClient()
            nextUsage.interview_sessions = guestInterview.count
          }
          return nextUsage
        })
      }
    } catch (error) {
      console.error('Failed to refresh usage:', error)
      if (!isAuth) {
        const guestInterview = getGuestInterviewUsageClient()
        setUsage((prev) => ({ ...prev, interview_sessions: guestInterview.count }))
      }
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    const initializeAuth = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (!isMounted) return

        if (error) {
          console.error('Failed to load auth session:', error)
          setUser(null)
          await refreshUsage(false)
          return
        }

        const nextUser = data.session?.user ?? null
        setUser(nextUser)
        await refreshUsage(Boolean(nextUser))
      } catch (error) {
        if (!isMounted) return
        console.error('Failed to initialize auth session:', error)
        setUser(null)
        await refreshUsage(false)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    void initializeAuth()

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return
      try {
        const nextUser = session?.user ?? null
        setUser(nextUser)
        setLimitReachedFeature(null)
        await refreshUsage(Boolean(nextUser))
      } catch (error) {
        console.error('Failed to handle auth state change:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    })

    return () => {
      isMounted = false
      authListener.subscription.unsubscribe()
    }
  }, [refreshUsage])

  const isAuthenticated = Boolean(user)

  const canUse = useCallback((feature: FeatureKey) => {
    if (isAuthenticated) {
      const limit = AUTH_LIMITS[feature]
      if (limit === null) return true
      return (usage[feature] ?? 0) < limit
    }

    const limit = GUEST_LIMITS[feature]
    if (limit === 0) return false
    return (usage[feature] ?? 0) < limit
  }, [isAuthenticated, usage])

  const consume = useCallback(async (feature: FeatureKey, options?: ConsumeOptions) => {
    if (!isAuthenticated && feature === 'interview_sessions') {
      const result = consumeGuestInterviewAttemptClient()
      setUsage((prev) => ({ ...prev, interview_sessions: result.count }))
      if (!result.allowed) {
        setLimitReachedFeature(feature)
      }
      return result.allowed
    }

    try {
      const guestId = !isAuthenticated ? getGuestIdClient() : ''
      const response = await fetch('/api/access/consume', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(guestId ? { 'x-guest-id': guestId } : {}),
        },
        body: JSON.stringify({
          feature,
          metadata: options?.metadata ?? {},
        }),
      })

      if (response.status === 429) {
        setLimitReachedFeature(feature)
        return false
      }

      if (!response.ok) {
        return false
      }

      const payload = await response.json()
      if (payload.usage) {
        setUsage((prev) => ({ ...prev, ...payload.usage }))
      } else {
        await refreshUsage(isAuthenticated)
      }
      return true
    } catch (error) {
      console.error('Failed to track usage:', error)
      return false
    }
  }, [isAuthenticated, refreshUsage])

  const checkOrPrompt = useCallback((feature: FeatureKey) => {
    const allowed = canUse(feature)
    if (!allowed) {
      setLimitReachedFeature(feature)
    }
    return allowed
  }, [canUse])

  const limits = useMemo(
    () => (isAuthenticated ? AUTH_LIMITS : GUEST_LIMITS),
    [isAuthenticated]
  )
  const guestInterviewUsage = useMemo(
    () => (!isAuthenticated ? getGuestInterviewUsageClient() : null),
    [isAuthenticated, usage.interview_sessions, loading]
  )

  return {
    loading,
    user,
    usage,
    limits,
    isAuthenticated,
    canUse,
    consume,
    checkOrPrompt,
    refreshUsage,
    limitReachedFeature,
    guestInterviewResetTime: guestInterviewUsage?.resetTime ?? null,
    guestInterviewRemainingMs: guestInterviewUsage?.remainingMs ?? 0,
    guestInterviewLimitReached: guestInterviewUsage?.isLimited ?? false,
    closeLimitModal: () => setLimitReachedFeature(null),
    openLimitModal: (feature: FeatureKey) => setLimitReachedFeature(feature),
    getLimitForFeature: (feature: FeatureKey) => getLimitForUser(feature, isAuthenticated),
  }
}


export type FeatureKey =
  | 'interview_sessions'
  | 'skilllens_roadmaps'
  | 'linkedin_optimizations'
  | 'resume_downloads'
  | 'industry_insights'

export const GUEST_LIMITS: Record<FeatureKey, number> = {
  interview_sessions: 2,
  skilllens_roadmaps: 2,
  linkedin_optimizations: 1,
  resume_downloads: 1,
  industry_insights: 0,
}

export const AUTH_LIMITS: Record<FeatureKey, number | null> = {
  interview_sessions: null,
  skilllens_roadmaps: null,
  linkedin_optimizations: null,
  resume_downloads: null,
  industry_insights: null,
}

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  interview_sessions: 'AI Interview Sessions',
  skilllens_roadmaps: 'SkillLens Roadmaps',
  linkedin_optimizations: 'LinkedIn Optimizations',
  resume_downloads: 'Resume Downloads',
  industry_insights: 'Industry Insights',
}

export type UsageSnapshot = Record<FeatureKey, number>

const GUEST_INTERVIEW_COUNT_KEY = 'guest_interview_count'
const GUEST_RESET_TIME_KEY = 'guest_reset_time'
const GUEST_INTERVIEW_WINDOW_MS = 24 * 60 * 60 * 1000
const GUEST_INTERVIEW_LIMIT = 2

export function createEmptyUsage(): UsageSnapshot {
  return {
    interview_sessions: 0,
    skilllens_roadmaps: 0,
    linkedin_optimizations: 0,
    resume_downloads: 0,
    industry_insights: 0,
  }
}

export function isLimitedForUser(feature: FeatureKey, isAuthenticated: boolean) {
  if (isAuthenticated) {
    return AUTH_LIMITS[feature] !== null
  }
  return GUEST_LIMITS[feature] > 0
}

export function getLimitForUser(feature: FeatureKey, isAuthenticated: boolean) {
  return isAuthenticated ? AUTH_LIMITS[feature] : GUEST_LIMITS[feature]
}

type GuestInterviewState = {
  count: number
  resetTime: number
}

function parsePositiveInt(value: string | null) {
  if (!value) return 0
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

function getStoredGuestInterviewState(now: number): GuestInterviewState {
  if (typeof window === 'undefined') {
    return { count: 0, resetTime: now + GUEST_INTERVIEW_WINDOW_MS }
  }

  const storedCount = parsePositiveInt(window.localStorage.getItem(GUEST_INTERVIEW_COUNT_KEY))
  const storedResetTime = parsePositiveInt(window.localStorage.getItem(GUEST_RESET_TIME_KEY))
  const hasValidResetTime = storedResetTime > now
  const resetTime = hasValidResetTime ? storedResetTime : now + GUEST_INTERVIEW_WINDOW_MS
  const count = hasValidResetTime ? storedCount : 0

  window.localStorage.setItem(GUEST_INTERVIEW_COUNT_KEY, String(count))
  window.localStorage.setItem(GUEST_RESET_TIME_KEY, String(resetTime))

  return { count, resetTime }
}

export function getGuestInterviewUsageClient() {
  const now = Date.now()
  const { count, resetTime } = getStoredGuestInterviewState(now)
  const remainingMs = Math.max(0, resetTime - now)

  return {
    count,
    resetTime,
    remainingMs,
    limit: GUEST_INTERVIEW_LIMIT,
    isLimited: count >= GUEST_INTERVIEW_LIMIT,
  }
}

export function consumeGuestInterviewAttemptClient() {
  const now = Date.now()
  const { count, resetTime } = getStoredGuestInterviewState(now)
  const nextCount = count + 1
  const allowed = nextCount <= GUEST_INTERVIEW_LIMIT

  if (typeof window !== 'undefined' && allowed) {
    window.localStorage.setItem(GUEST_INTERVIEW_COUNT_KEY, String(nextCount))
    window.localStorage.setItem(GUEST_RESET_TIME_KEY, String(resetTime))
  }

  return {
    allowed,
    count: allowed ? nextCount : count,
    resetTime,
    remainingMs: Math.max(0, resetTime - now),
  }
}

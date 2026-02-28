import { AUTH_LIMITS, createEmptyUsage, GUEST_LIMITS, type FeatureKey, type UsageSnapshot } from '@/lib/access-control'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'

const WINDOW_HOURS = 5

type UsageActor = {
  isGuest: boolean
  userId?: string | null
  guestId?: string | null
}

type FeatureUsageRow = {
  id: string
  user_id: string | null
  guest_id: string | null
  is_guest: boolean
  feature_name: FeatureKey
  usage_count: number
  window_start: string
  window_expires_at: string
}

export type ConsumeFeatureUsageResult =
  | {
      ok: true
      usageCount: number
      limit: number | null
      windowExpiresAt: string
    }
  | {
      ok: false
      reason: 'limit_reached' | 'invalid_actor' | 'db_error'
      usageCount?: number
      limit?: number | null
      windowExpiresAt?: string
      remainingMs?: number
      remainingSeconds?: number
    }

function addHours(date: Date, hours: number) {
  return new Date(date.getTime() + hours * 60 * 60 * 1000)
}

function getActorFilter(actor: UsageActor) {
  if (actor.isGuest) {
    return { is_guest: true, guest_id: actor.guestId ?? null, user_id: null }
  }
  return { is_guest: false, user_id: actor.userId ?? null, guest_id: null }
}

function getLimitForActor(feature: FeatureKey, actor: UsageActor) {
  return actor.isGuest ? GUEST_LIMITS[feature] : AUTH_LIMITS[feature]
}

function buildWindow(now: Date) {
  return {
    window_start: now.toISOString(),
    window_expires_at: addHours(now, WINDOW_HOURS).toISOString(),
  }
}

async function getUsageRow(feature: FeatureKey, actor: UsageActor) {
  const supabase = createAdminSupabaseClient()
  const filter = getActorFilter(actor)

  const { data, error } = await supabase
    .from('feature_usage_tracking')
    .select('*')
    .eq('feature_name', feature)
    .eq('is_guest', filter.is_guest)
    .eq(filter.is_guest ? 'guest_id' : 'user_id', filter.is_guest ? filter.guest_id : filter.user_id)
    .maybeSingle()

  if (error) {
    return null
  }
  return (data as FeatureUsageRow | null) ?? null
}

async function upsertUsageRow(feature: FeatureKey, actor: UsageActor, usageCount: number, now: Date) {
  const supabase = createAdminSupabaseClient()
  const filter = getActorFilter(actor)
  const window = buildWindow(now)

  const payload = {
    ...filter,
    feature_name: feature,
    usage_count: usageCount,
    window_start: window.window_start,
    window_expires_at: window.window_expires_at,
  }

  const onConflict = filter.is_guest ? 'feature_name,is_guest,guest_id' : 'feature_name,is_guest,user_id'

  const { error } = await supabase
    .from('feature_usage_tracking')
    .upsert(payload, { onConflict })

  return !error
}

async function updateUsageRowById(rowId: string, updates: Partial<FeatureUsageRow>) {
  const supabase = createAdminSupabaseClient()
  const { error } = await supabase
    .from('feature_usage_tracking')
    .update(updates)
    .eq('id', rowId)

  return !error
}

export async function getUsageSnapshotForActor(actor: UsageActor): Promise<UsageSnapshot> {
  if ((actor.isGuest && !actor.guestId) || (!actor.isGuest && !actor.userId)) {
    return createEmptyUsage()
  }

  const supabase = createAdminSupabaseClient()
  const filter = getActorFilter(actor)
  const now = new Date()
  const snapshot = createEmptyUsage()

  const { data, error } = await supabase
    .from('feature_usage_tracking')
    .select('feature_name,usage_count,window_expires_at')
    .eq('is_guest', filter.is_guest)
    .eq(filter.is_guest ? 'guest_id' : 'user_id', filter.is_guest ? filter.guest_id : filter.user_id)

  if (error || !data) {
    return snapshot
  }

  for (const row of data as Array<{ feature_name: FeatureKey; usage_count: number; window_expires_at: string }>) {
    const expiresAt = new Date(row.window_expires_at)
    snapshot[row.feature_name] = expiresAt <= now ? 0 : row.usage_count
  }

  return snapshot
}

export async function checkAndConsumeFeatureUsage(
  featureName: FeatureKey,
  userIdOrGuestId: UsageActor
): Promise<ConsumeFeatureUsageResult> {
  const actor = userIdOrGuestId
  const actorId = actor.isGuest ? actor.guestId : actor.userId
  if (!actorId) {
    return { ok: false, reason: 'invalid_actor' }
  }

  const limit = getLimitForActor(featureName, actor)
  const now = new Date()
  const existing = await getUsageRow(featureName, actor)

  if (!existing) {
    const initialUsage = 0
    const created = await upsertUsageRow(featureName, actor, initialUsage, now)
    if (!created) {
      return { ok: false, reason: 'db_error' }
    }

    if (limit !== null && initialUsage >= limit) {
      return {
        ok: false,
        reason: 'limit_reached',
        usageCount: initialUsage,
        limit,
        windowExpiresAt: addHours(now, WINDOW_HOURS).toISOString(),
        remainingMs: WINDOW_HOURS * 60 * 60 * 1000,
        remainingSeconds: WINDOW_HOURS * 60 * 60,
      }
    }

    const incremented = await upsertUsageRow(featureName, actor, initialUsage + 1, now)
    if (!incremented) {
      return { ok: false, reason: 'db_error' }
    }

    return {
      ok: true,
      usageCount: initialUsage + 1,
      limit,
      windowExpiresAt: addHours(now, WINDOW_HOURS).toISOString(),
    }
  }

  let usageCount = existing.usage_count
  let windowStart = existing.window_start
  let windowExpiresAt = existing.window_expires_at
  const existingExpires = new Date(existing.window_expires_at)

  if (existingExpires <= now) {
    usageCount = 0
    const nextWindow = buildWindow(now)
    windowStart = nextWindow.window_start
    windowExpiresAt = nextWindow.window_expires_at

    const reset = await updateUsageRowById(existing.id, {
      usage_count: usageCount,
      window_start: windowStart,
      window_expires_at: windowExpiresAt,
    })

    if (!reset) {
      return { ok: false, reason: 'db_error' }
    }
  }

  if (limit !== null && usageCount >= limit) {
    const remainingMs = Math.max(0, new Date(windowExpiresAt).getTime() - now.getTime())
    return {
      ok: false,
      reason: 'limit_reached',
      usageCount,
      limit,
      windowExpiresAt,
      remainingMs,
      remainingSeconds: Math.ceil(remainingMs / 1000),
    }
  }

  const nextUsage = usageCount + 1
  const incremented = await updateUsageRowById(existing.id, {
    usage_count: nextUsage,
    window_start: windowStart,
    window_expires_at: windowExpiresAt,
  })

  if (!incremented) {
    return { ok: false, reason: 'db_error' }
  }

  return {
    ok: true,
    usageCount: nextUsage,
    limit,
    windowExpiresAt,
  }
}

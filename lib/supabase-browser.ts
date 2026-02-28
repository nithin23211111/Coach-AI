import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

let inFlightSessionPromise: Promise<Session | null> | null = null
let sessionFetchBlockedUntil = 0

const SESSION_FETCH_BLOCK_MS = 5000

type SafeSessionResult = {
  session: Session | null
  error: string | null
  unreachable: boolean
}

function toAuthErrorMessage(error: unknown) {
  if (error instanceof Error && error.message.trim()) return error.message
  return 'Unable to validate authentication session'
}

function isRetryableNetworkError(message: string) {
  const normalized = message.toLowerCase()
  return normalized.includes('failed to fetch')
    || normalized.includes('networkerror')
    || normalized.includes('authretryablefetcherror')
    || normalized.includes('fetch failed')
}

export function createClient() {
  return supabase
}

export async function getSessionSafely(): Promise<SafeSessionResult> {
  const now = Date.now()
  if (now < sessionFetchBlockedUntil) {
    return {
      session: null,
      error: 'Authentication service is temporarily unreachable. Please try again in a moment.',
      unreachable: true,
    }
  }

  if (!inFlightSessionPromise) {
    inFlightSessionPromise = (async () => {
      const { data, error } = await supabase.auth.getSession()
      if (error) {
        throw error
      }
      return data.session ?? null
    })()
      .catch((error: unknown) => {
        const message = toAuthErrorMessage(error)
        if (isRetryableNetworkError(message)) {
          sessionFetchBlockedUntil = Date.now() + SESSION_FETCH_BLOCK_MS
        }
        throw error
      })
      .finally(() => {
        inFlightSessionPromise = null
      })
  }

  try {
    const session = await inFlightSessionPromise
    return { session, error: null, unreachable: false }
  } catch (error) {
    const message = toAuthErrorMessage(error)
    const unreachable = isRetryableNetworkError(message)
    return {
      session: null,
      error: unreachable
        ? 'Unable to reach Supabase right now. Check your internet connection and try again.'
        : message,
      unreachable,
    }
  }
}

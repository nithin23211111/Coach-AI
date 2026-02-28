const GUEST_ID_STORAGE_KEY = 'coach_ai_guest_id_v1'
export const GUEST_ID_COOKIE_NAME = 'coach_ai_guest_id'

function generateGuestId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `guest_${Math.random().toString(36).slice(2)}_${Date.now()}`
}

export function getGuestIdFromCookieString(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null
  const target = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${GUEST_ID_COOKIE_NAME}=`))
  if (!target) return null
  const value = target.split('=').slice(1).join('=').trim()
  return value || null
}

export function getGuestIdClient(): string {
  if (typeof window === 'undefined') {
    return ''
  }

  const existing = window.localStorage.getItem(GUEST_ID_STORAGE_KEY)
  if (existing && existing.trim()) {
    document.cookie = `${GUEST_ID_COOKIE_NAME}=${existing}; path=/; max-age=31536000; SameSite=Lax`
    return existing
  }

  const guestId = generateGuestId()
  window.localStorage.setItem(GUEST_ID_STORAGE_KEY, guestId)
  document.cookie = `${GUEST_ID_COOKIE_NAME}=${guestId}; path=/; max-age=31536000; SameSite=Lax`
  return guestId
}

export function getGuestIdFromRequest(request: Request): string | null {
  const fromHeader = request.headers.get('x-guest-id')
  if (fromHeader && fromHeader.trim()) return fromHeader.trim()
  return getGuestIdFromCookieString(request.headers.get('cookie'))
}

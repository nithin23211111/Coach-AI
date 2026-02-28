import { createAdminSupabaseClient } from '@/lib/supabase-admin'

export async function POST(request: Request) {
  try {
    const payload = await request.json().catch(() => ({}))
    const guestId = typeof payload?.guestId === 'string' ? payload.guestId.trim() : ''

    const supabase = createAdminSupabaseClient()
    let query = supabase.from('feature_usage_tracking').delete().eq('is_guest', true)

    if (guestId) {
      query = query.eq('guest_id', guestId)
    }

    const { error } = await query
    if (error) {
      return Response.json({ error: 'Failed to reset guest usage' }, { status: 500 })
    }

    return Response.json({
      ok: true,
      scope: guestId ? 'single_guest' : 'all_guests',
      guestId: guestId || null,
    })
  } catch (error) {
    console.error('Reset guest usage error:', error)
    return Response.json({ error: 'Failed to reset guest usage' }, { status: 500 })
  }
}

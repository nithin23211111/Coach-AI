import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getCurrentUser } from '@/lib/auth'
import { NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const supabase = await createServerSupabaseClient()

    // Get all coaching sessions for the user
    const { data: sessions, error } = await supabase
      .from('coaching_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      })
    }

    return new Response(JSON.stringify(sessions), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Get sessions error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { title } = await req.json()

    const supabase = await createServerSupabaseClient()

    // Create new coaching session
    const { data: session, error } = await supabase
      .from('coaching_sessions')
      .insert({
        user_id: user.id,
        title: title || 'New Coaching Session',
        status: 'active',
      })
      .select()
      .single()

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      })
    }

    return new Response(JSON.stringify(session), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Create session error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

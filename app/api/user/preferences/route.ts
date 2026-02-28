import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getCurrentUser } from '@/lib/auth'
import { NextRequest } from 'next/server'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const supabase = await createServerSupabaseClient()

    // Get user coaching preferences
    let { data: preferences, error } = await supabase
      .from('coaching_preferences')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // If preferences don't exist, create defaults
    if (error && error.code === 'PGRST116') {
      const { data: newPreferences } = await supabase
        .from('coaching_preferences')
        .insert({
          user_id: user.id,
          coaching_style: 'supportive',
          tone: 'professional',
          preferred_ai_model: 'claude',
          session_frequency: 'weekly',
          focus_areas: ['career growth', 'skill development'],
        })
        .select()
        .single()

      preferences = newPreferences
    }

    return new Response(JSON.stringify(preferences), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Get preferences error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const preferenceData = await req.json()

    const supabase = await createServerSupabaseClient()

    // Update coaching preferences
    const { data: preferences, error } = await supabase
      .from('coaching_preferences')
      .update(preferenceData)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      })
    }

    return new Response(JSON.stringify(preferences), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Update preferences error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

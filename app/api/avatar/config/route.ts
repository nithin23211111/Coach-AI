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

    // Get user avatar configuration
    let { data: config, error } = await supabase
      .from('avatar_configurations')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // If config doesn't exist, create default
    if (error && error.code === 'PGRST116') {
      const { data: newConfig } = await supabase
        .from('avatar_configurations')
        .insert({
          user_id: user.id,
          avatar_name: 'Alex',
          avatar_style: 'professional',
          spline_model_url: 'https://prod.spline.design/default-coach/scene.splinecode',
          voice_enabled: true,
          voice_tone: 'warm',
          animation_style: 'gestures',
        })
        .select()
        .single()

      config = newConfig
    }

    return new Response(JSON.stringify(config), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Get avatar config error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const configData = await req.json()

    const supabase = await createServerSupabaseClient()

    // Update avatar configuration
    const { data: config, error } = await supabase
      .from('avatar_configurations')
      .update(configData)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      })
    }

    return new Response(JSON.stringify(config), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Update avatar config error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

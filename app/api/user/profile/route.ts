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

    // Get user profile
    let { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // If profile doesn't exist, create a default one
    if (error && error.code === 'PGRST116') {
      const { data: newProfile } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          first_name: user.user_metadata?.full_name?.split(' ')[0] || '',
          last_name: user.user_metadata?.full_name?.split(' ')[1] || '',
        })
        .select()
        .single()

      profile = newProfile
    }

    return new Response(JSON.stringify({ user, profile }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Get profile error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const profileData = await req.json()

    const supabase = await createServerSupabaseClient()

    // Update user profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      })
    }

    return new Response(JSON.stringify(profile), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Update profile error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

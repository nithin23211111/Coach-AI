import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

type StartInterviewSessionBody = {
  role?: string
  mode?: 'standard' | 'timed'
  totalQuestions?: number
}

export async function POST(request: Request) {
  try {
    let body: StartInterviewSessionBody
    try {
      body = (await request.json()) as StartInterviewSessionBody
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const role = typeof body.role === 'string' ? body.role.trim() : ''
    const mode = body.mode === 'timed' ? 'timed' : 'standard'
    const totalQuestions =
      typeof body.totalQuestions === 'number' && Number.isFinite(body.totalQuestions)
        ? Math.max(1, Math.floor(body.totalQuestions))
        : 12

    if (!role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      throw new Error(userError.message || 'Failed to validate authentication')
    }

    if (!user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('interview_sessions')
      .insert({
        user_id: user.id,
        role,
        mode,
        total_questions: totalQuestions,
        status: 'in_progress',
        started_at: new Date().toISOString(),
      })
      .select('id')
      .single()

    if (error || !data) {
      throw new Error(error?.message ?? 'Failed to create interview session')
    }

    return NextResponse.json({ success: true, interviewId: data.id })
  } catch (error) {
    const message = error instanceof Error && error.message.trim()
      ? error.message
      : 'Failed to create interview session'
    console.error('Unexpected error in interview start route:', error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

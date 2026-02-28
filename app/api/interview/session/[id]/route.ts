import { createAdminSupabaseClient } from '@/lib/supabase-admin'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const sessionId = params?.id ? String(params.id).trim() : ''
    if (!sessionId) {
      return Response.json({ error: 'Session ID is required' }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()
    const { data: session, error } = await supabase
      .from('interview_sessions')
      .select('id, role, mode, total_questions, current_question_number, difficulty_level, score, started_at, completed_at')
      .eq('id', sessionId)
      .single()

    if (error || !session) {
      return Response.json({ error: 'Session not found' }, { status: 404 })
    }

    return Response.json({ session })
  } catch (error) {
    console.error('Failed to load interview session:', error)
    return Response.json({ error: 'Failed to load interview session' }, { status: 500 })
  }
}

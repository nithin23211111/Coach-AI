import { getCurrentUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const id = body?.id ? String(body.id).trim() : null
    const role = String(body?.role || '').trim()
    const jobDescription = String(body?.jobDescription || '').trim()
    const resumeData = body?.resume ?? null
    const atsScore = Number.isFinite(body?.atsScore) ? Math.max(0, Math.min(100, Number(body.atsScore))) : null
    const atsBreakdown = body?.atsBreakdown && typeof body.atsBreakdown === 'object' ? body.atsBreakdown : null

    if (!resumeData) {
      return Response.json({ error: 'Resume payload is required' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    if (id) {
      const { data, error } = await supabase
        .from('ai_resumes')
        .update({
          role,
          job_description: jobDescription,
          resume_data: resumeData,
          ats_score: atsScore,
          ats_breakdown: atsBreakdown,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select('id, role, ats_score, updated_at')
        .single()

      if (error || !data) {
        console.error('Failed to update AI resume:', error)
        return Response.json({ error: 'Failed to update resume' }, { status: 500 })
      }

      return Response.json({ record: data })
    }

    const { data, error } = await supabase
      .from('ai_resumes')
      .insert({
        user_id: user.id,
        role,
        job_description: jobDescription,
        resume_data: resumeData,
        ats_score: atsScore,
        ats_breakdown: atsBreakdown,
      })
      .select('id, role, ats_score, created_at, updated_at')
      .single()

    if (error || !data) {
      console.error('Failed to save AI resume:', error)
      return Response.json({ error: 'Failed to save resume' }, { status: 500 })
    }

    return Response.json({ record: data })
  } catch (error) {
    console.error('Resume save error:', error)
    return Response.json({ error: 'Failed to save resume' }, { status: 500 })
  }
}

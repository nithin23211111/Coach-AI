import { getCurrentUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return Response.json({ records: [] })
    }

    const url = new URL(request.url)
    const resumeId = url.searchParams.get('id')
    const supabase = await createServerSupabaseClient()

    if (resumeId) {
      const { data, error } = await supabase
        .from('ai_resumes')
        .select('id, role, job_description, resume_data, ats_score, ats_breakdown, created_at, updated_at')
        .eq('user_id', user.id)
        .eq('id', resumeId)
        .single()

      if (error) {
        console.error('Failed to fetch resume record:', error)
        return Response.json({ error: 'Failed to fetch resume' }, { status: 500 })
      }

      return Response.json({ record: data })
    }

    const { data, error } = await supabase
      .from('ai_resumes')
      .select('id, role, ats_score, created_at, updated_at')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(30)

    if (error) {
      console.error('Failed to fetch resume history:', error)
      return Response.json({ error: 'Failed to fetch resume history' }, { status: 500 })
    }

    return Response.json({ records: data || [] })
  } catch (error) {
    console.error('Resume history error:', error)
    return Response.json({ error: 'Failed to fetch resume history' }, { status: 500 })
  }
}

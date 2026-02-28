import { getCurrentUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const resumeText = String(body?.resumeText || '').trim()
    const jobDescription = String(body?.jobDescription || '').trim()
    const atsScore = Number.isFinite(body?.atsScore) ? Math.max(0, Math.min(100, Number(body.atsScore))) : 0
    const missingKeywords = Array.isArray(body?.missingKeywords)
      ? body.missingKeywords.map((item: unknown) => String(item).trim()).filter(Boolean).slice(0, 10)
      : []

    if (!resumeText || !jobDescription) {
      return Response.json({ error: 'resumeText and jobDescription are required' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('resume_analysis')
      .insert({
        user_id: user.id,
        resume_text: resumeText,
        job_description: jobDescription,
        ats_score: atsScore,
        missing_keywords: missingKeywords,
      })
      .select('id, created_at')
      .single()

    if (error) {
      console.error('Failed to save resume analysis:', error)
      return Response.json({ error: 'Failed to save resume analysis' }, { status: 500 })
    }

    return Response.json({ record: data })
  } catch (error) {
    console.error('Resume analysis route error:', error)
    return Response.json({ error: 'Failed to save resume analysis' }, { status: 500 })
  }
}

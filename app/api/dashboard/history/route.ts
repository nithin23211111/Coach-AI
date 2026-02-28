import { getCurrentUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabaseClient()

    const [{ data: interviews }, { data: roadmaps }, { count: resumeCount }, { data: savedInsights }] = await Promise.all([
      supabase
        .from('interview_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('skilllens_roadmap_history')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
      supabase
        .from('resume_download_history')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
      supabase
        .from('saved_insights')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
    ])

    return Response.json({
      interviews: interviews ?? [],
      roadmaps: roadmaps ?? [],
      resumeCount: resumeCount ?? 0,
      savedInsights: savedInsights ?? [],
    })
  } catch (error) {
    console.error('Dashboard history error:', error)
    return Response.json({ error: 'Failed to load dashboard history' }, { status: 500 })
  }
}

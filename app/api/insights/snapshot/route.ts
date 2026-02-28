import { getCurrentUser } from '@/lib/auth'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'

type SaveInsightSnapshotBody = {
  industryName?: string
  growthRate?: number
  avgSalary?: number
  demandLevel?: string
  hiringTrend?: number
  confidenceScore?: number
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SaveInsightSnapshotBody
    const industryName = typeof body.industryName === 'string' ? body.industryName.trim() : ''
    const growthRate = Number(body.growthRate)
    const avgSalary = Number(body.avgSalary)
    const demandLevel = typeof body.demandLevel === 'string' ? body.demandLevel.trim() : ''
    const hiringTrend = Number(body.hiringTrend)
    const confidenceScore = Number(body.confidenceScore)

    if (
      !industryName ||
      !Number.isFinite(growthRate) ||
      !Number.isFinite(avgSalary) ||
      !demandLevel ||
      !Number.isFinite(hiringTrend) ||
      !Number.isFinite(confidenceScore)
    ) {
      return Response.json({ error: 'Invalid snapshot payload' }, { status: 400 })
    }

    const user = await getCurrentUser()
    const supabase = createAdminSupabaseClient()

    const { data, error } = await supabase
      .from('saved_insights')
      .insert({
        user_id: user?.id ?? null,
        industry_name: industryName,
        growth_rate: growthRate,
        avg_salary: avgSalary,
        demand_level: demandLevel,
        hiring_trend: hiringTrend,
        confidence_score: Math.max(0, Math.min(100, Math.round(confidenceScore))),
      })
      .select('id')
      .single()

    if (error || !data) {
      console.error('Saved insight snapshot insert error:', error)
      return Response.json({ error: 'Failed to save insight snapshot' }, { status: 500 })
    }

    return Response.json({ ok: true, id: data.id })
  } catch (error) {
    console.error('Save insight snapshot route error:', error)
    return Response.json({ error: 'Failed to save insight snapshot' }, { status: 500 })
  }
}

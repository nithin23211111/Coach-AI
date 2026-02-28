import { getCurrentUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'

type PerformanceRow = {
  id: string
  session_id: string
  role: string
  overall_score: number
  clarity_score: number
  technical_score: number
  structure_score: number
  confidence_score: number
  strengths: string[] | null
  weaknesses: string[] | null
  improvement_tips: string | null
  created_at: string
}

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return Response.json({ authenticated: false, records: [] })
    }

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('interview_performance')
      .select('id, session_id, role, overall_score, clarity_score, technical_score, structure_score, confidence_score, strengths, weaknesses, improvement_tips, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Failed to fetch interview performance:', error)
      return Response.json({ error: 'Failed to fetch interview performance' }, { status: 500 })
    }

    const records = (data || []) as PerformanceRow[]
    const trend = records.map((record, index) => {
      const previous = index > 0 ? records[index - 1].overall_score : record.overall_score
      const progress = previous > 0 ? Number((((record.overall_score - previous) / previous) * 100).toFixed(2)) : 0
      return {
        sessionId: record.session_id,
        score: record.overall_score,
        createdAt: record.created_at,
        progress,
      }
    })

    const weaknessesCount = new Map<string, number>()
    for (const record of records) {
      for (const weakness of record.weaknesses || []) {
        const key = String(weakness).trim()
        if (!key) continue
        weaknessesCount.set(key, (weaknessesCount.get(key) || 0) + 1)
      }
    }

    const commonWeaknesses = Array.from(weaknessesCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([label, count]) => ({ label, count }))

    const allTips = records
      .map((record) => String(record.improvement_tips || '').trim())
      .filter(Boolean)
    const focusAreas = Array.from(new Set(allTips)).slice(0, 6)
    const averageScore = records.length
      ? Number((records.reduce((total, row) => total + row.overall_score, 0) / records.length).toFixed(2))
      : 0
    const latestScore = records.length ? records[records.length - 1].overall_score : 0
    const previousScore = records.length > 1 ? records[records.length - 2].overall_score : latestScore
    const progressPercentage = previousScore > 0 ? Number((((latestScore - previousScore) / previousScore) * 100).toFixed(2)) : 0

    return Response.json({
      authenticated: true,
      records,
      trend,
      analytics: {
        averageScore,
        latestScore,
        progressPercentage,
        commonWeaknesses,
        focusAreas,
      },
    })
  } catch (error) {
    console.error('Interview performance route error:', error)
    return Response.json({ error: 'Failed to fetch interview performance' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const sessionId = String(body?.session_id || '').trim()
    const role = String(body?.role || '').trim()
    const overallScore = Number.isFinite(body?.overall_score) ? Math.max(0, Math.min(100, Math.round(Number(body.overall_score)))) : 0
    const clarityScore = Number.isFinite(body?.clarity_score) ? Math.max(0, Math.min(100, Math.round(Number(body.clarity_score)))) : 0
    const technicalScore = Number.isFinite(body?.technical_score) ? Math.max(0, Math.min(100, Math.round(Number(body.technical_score)))) : 0
    const structureScore = Number.isFinite(body?.structure_score) ? Math.max(0, Math.min(100, Math.round(Number(body.structure_score)))) : 0
    const confidenceScore = Number.isFinite(body?.confidence_score) ? Math.max(0, Math.min(100, Math.round(Number(body.confidence_score)))) : 0
    const strengths = Array.isArray(body?.strengths) ? body.strengths.map((item: unknown) => String(item).trim()).filter(Boolean).slice(0, 8) : []
    const weaknesses = Array.isArray(body?.weaknesses) ? body.weaknesses.map((item: unknown) => String(item).trim()).filter(Boolean).slice(0, 8) : []
    const improvementTips = String(body?.improvement_tips || '').trim()

    if (!sessionId) {
      return Response.json({ error: 'session_id is required' }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('interview_performance')
      .insert({
        user_id: user.id,
        session_id: sessionId,
        role,
        overall_score: overallScore,
        clarity_score: clarityScore,
        technical_score: technicalScore,
        structure_score: structureScore,
        confidence_score: confidenceScore,
        strengths,
        weaknesses,
        improvement_tips: improvementTips,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Failed to save interview performance:', error)
      return Response.json({ error: 'Failed to save interview performance' }, { status: 500 })
    }

    return Response.json({ record: data })
  } catch (error) {
    console.error('Interview performance POST route error:', error)
    return Response.json({ error: 'Failed to save interview performance' }, { status: 500 })
  }
}

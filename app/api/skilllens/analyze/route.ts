import { analyzeSkillLensProfile } from '@/lib/ai-utils'
import { getCurrentUser } from '@/lib/auth'
import { getGuestIdFromRequest } from '@/lib/guest-id'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import type { ExperienceLevel, SkillLensInput } from '@/lib/skilllens'
import { checkAndConsumeFeatureUsage } from '@/lib/usage-utils'

function isExperienceLevel(value: unknown): value is ExperienceLevel {
  return value === 'Beginner' || value === 'Intermediate' || value === 'Advanced'
}

function parseSkills(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

export async function POST(request: Request) {
  try {
    const payload = await request.json()
    const currentSkills = parseSkills(payload?.currentSkills)
    const experienceLevel = payload?.experienceLevel

    if (
      typeof payload?.currentRoleOrField !== 'string' ||
      typeof payload?.targetRole !== 'string' ||
      !isExperienceLevel(experienceLevel) ||
      currentSkills.length === 0
    ) {
      return Response.json({ error: 'Invalid input payload' }, { status: 400 })
    }

    const input: SkillLensInput = {
      currentRoleOrField: payload.currentRoleOrField.trim(),
      currentSkills,
      experienceLevel,
      targetRole: payload.targetRole.trim(),
    }

    const user = await getCurrentUser()
    const guestId = !user ? getGuestIdFromRequest(request) ?? `anon_${crypto.randomUUID()}` : null

    const usageResult = await checkAndConsumeFeatureUsage('skilllens_roadmaps', {
      isGuest: !user,
      userId: user?.id ?? null,
      guestId,
    })

    if (!usageResult.ok) {
      if (usageResult.reason === 'limit_reached') {
        return Response.json(
          {
            error: 'limit_reached',
            feature: 'skilllens_roadmaps',
            limit: usageResult.limit,
            usageCount: usageResult.usageCount,
            window_expires_at: usageResult.windowExpiresAt,
            remaining_ms: usageResult.remainingMs,
            remaining_seconds: usageResult.remainingSeconds,
          },
          { status: 429 }
        )
      }
      console.error('SkillLens usage consume failed:', usageResult)
      return Response.json({ error: 'Failed to update usage' }, { status: 500 })
    }

    const supabase = await createServerSupabaseClient()

    const analysis = await analyzeSkillLensProfile(input)

    if (user) {
      const { error: saveError } = await supabase.from('skilllens_roadmap_history').insert({
        user_id: user.id,
        role_id: input.targetRole,
        roadmap: analysis.roadmapStages,
        progress: null,
        target_role: input.targetRole,
        current_role_or_field: input.currentRoleOrField,
        current_skills: input.currentSkills,
        experience_level: input.experienceLevel,
        skill_gap_analysis: analysis.skillGapAnalysis,
        roadmap_stages: analysis.roadmapStages,
        courses: {
          highlyRecommended: analysis.highlyRecommendedCourses,
          additional: analysis.additionalCourses,
        },
        projects: analysis.projects,
        full_response: analysis,
        analysis_generated_at: analysis.generatedAt,
      })

      if (saveError) {
        console.error('SkillLens history insert Supabase error:', saveError)
      }
    }

    return Response.json({
      analysis,
      saved: Boolean(user),
    })
  } catch (error) {
    console.error('SkillLens analysis error:', error)
    return Response.json({ error: 'Failed to generate analysis' }, { status: 500 })
  }
}

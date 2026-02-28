import { generateInsights } from '@/lib/ai-utils'
import { getCurrentUser } from '@/lib/auth'
import { getGuestIdFromRequest } from '@/lib/guest-id'
import { checkAndConsumeFeatureUsage } from '@/lib/usage-utils'

export async function GET(request: Request) {
  try {
    const user = await getCurrentUser()
    const guestId = !user ? getGuestIdFromRequest(request) : null

    if (!user && !guestId) {
      return Response.json({ error: 'Guest ID missing' }, { status: 400 })
    }

    const usageResult = await checkAndConsumeFeatureUsage('industry_insights', {
      isGuest: !user,
      userId: user?.id ?? null,
      guestId,
    })

    if (!usageResult.ok) {
      if (usageResult.reason === 'limit_reached') {
        return Response.json(
          {
            error: 'limit_reached',
            feature: 'industry_insights',
            limit: usageResult.limit,
            usageCount: usageResult.usageCount,
            window_expires_at: usageResult.windowExpiresAt,
            remaining_ms: usageResult.remainingMs,
            remaining_seconds: usageResult.remainingSeconds,
          },
          { status: 429 }
        )
      }
      return Response.json({ error: 'Failed to update usage' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const industry = searchParams.get('industry') || 'software'

    const insights = await generateInsights(industry)

    return Response.json(insights)
  } catch (error) {
    console.error('Error:', error)
    return Response.json(
      { error: 'Failed to generate insights' },
      { status: 500 }
    )
  }
}

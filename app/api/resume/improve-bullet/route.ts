import { improveBulletPoint } from '@/lib/ai-utils'

export async function POST(request: Request) {
  try {
    const { bullet } = await request.json()

    if (!bullet) {
      return Response.json(
        { error: 'Bullet point is required' },
        { status: 400 }
      )
    }

    const improved = await improveBulletPoint(bullet)

    return Response.json({
      improved: improved || bullet,
    })
  } catch (error) {
    console.error('Error:', error)
    return Response.json(
      { error: 'Failed to improve bullet point' },
      { status: 500 }
    )
  }
}

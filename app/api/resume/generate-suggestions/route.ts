import { generateResumeSuggestions } from '@/lib/ai-utils'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const kind = body?.kind === 'summary' ? 'summary' : 'bullets'

    const suggestions = await generateResumeSuggestions({
      kind,
      role: body?.role || '',
      title: body?.title || '',
      company: body?.company || '',
      summary: body?.summary || '',
      responsibilities: body?.responsibilities || '',
    })

    return Response.json(suggestions)
  } catch (error) {
    console.error('Error generating resume suggestions:', error)
    return Response.json({ error: 'Failed to generate suggestions' }, { status: 500 })
  }
}

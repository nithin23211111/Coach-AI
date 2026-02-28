import { rewriteResumeTextWithAI } from '@/lib/ai-utils'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const mode = body?.mode === 'ats' || body?.mode === 'stronger' ? body.mode : 'improve'
    const role = String(body?.role || '')
    const sourceText = String(body?.sourceText || '').trim()

    if (!sourceText) {
      return Response.json({ error: 'Source text is required' }, { status: 400 })
    }

    const rewritten = await rewriteResumeTextWithAI({ mode, role, sourceText })
    return Response.json({ rewritten })
  } catch (error) {
    console.error('Resume rewrite error:', error)
    return Response.json({ error: 'Failed to rewrite text' }, { status: 500 })
  }
}

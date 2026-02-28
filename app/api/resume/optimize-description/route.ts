import { generateWithAI } from '@/lib/ai-utils'

function cleanJsonPayload(raw: string): string {
  return raw.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const role = String(body?.role || '').trim()
    const rawDescription = String(body?.rawDescription || '').trim()
    const jobDescription = String(body?.jobDescription || '').trim()
    const section = body?.section === 'summary' ? 'summary' : 'experience'

    if (!rawDescription) {
      return Response.json({ error: 'rawDescription is required' }, { status: 400 })
    }

    const sectionInstruction =
      section === 'experience'
        ? 'Rewrite as concise ATS-friendly bullet points. Start bullets with strong action verbs and preserve only claims supported by the input.'
        : 'Rewrite as a concise professional summary paragraph with clear role alignment and truthful scope from the input.'

    const systemPrompt = `You are an ATS-focused resume writing assistant.
Rewrite the provided text to be concise, professional, and role-aligned.
Requirements:
- Use strong action verbs
- Improve clarity and structure
- ${sectionInstruction}
- Keep content truthful and grounded in provided input only
- Do NOT hallucinate fake achievements, numbers, tools, employers, or responsibilities
- Align wording with selected role and optional job description keywords when relevant
Return ONLY strict valid JSON with this exact shape:
{"optimized_text":"..."}`

    const prompt = `Section: ${section}
Role: ${role || 'N/A'}
Optional job description context: ${jobDescription || 'N/A'}
User raw description:
${rawDescription}`

    const aiRaw = await generateWithAI(prompt, systemPrompt)
    try {
      const parsed = JSON.parse(cleanJsonPayload(aiRaw)) as { optimized_text?: string }
      const optimizedText = String(parsed?.optimized_text || '').trim()
      return Response.json({ optimized_text: optimizedText || rawDescription })
    } catch {
      return Response.json({ optimized_text: rawDescription })
    }
  } catch (error) {
    console.error('Optimize description route error:', error)
    return Response.json({ error: 'Failed to optimize description' }, { status: 500 })
  }
}

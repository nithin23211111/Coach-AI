import { generateCoverLetterWithAI } from '@/lib/ai-utils'
import { splitLines, type ResumePayload } from '@/lib/resume-utils'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const resume = (body?.resume || null) as ResumePayload | null
    const companyName = String(body?.companyName || '').trim() || 'Hiring Team'
    const jobTitle = String(body?.jobTitle || '').trim() || resume?.role || 'Target Role'
    const jobDescription = String(body?.jobDescription || '').trim()

    if (!resume) {
      return Response.json({ error: 'Resume data is required' }, { status: 400 })
    }

    const experienceText = resume.experience
      .flatMap((item) => {
        const lines = splitLines(item.bullets)
        if (lines.length) return lines
        const fallback = [item.title, item.company, item.duration].filter(Boolean).join(' | ')
        return fallback ? [fallback] : []
      })
      .slice(0, 8)
      .join('\n')

    const content = await generateCoverLetterWithAI({
      companyName,
      jobTitle,
      role: resume.role,
      summary: resume.summary,
      skills: resume.skills,
      experience: experienceText,
      jobDescription,
    })

    return Response.json({ content })
  } catch (error) {
    console.error('Cover letter generation error:', error)
    return Response.json({ error: 'Failed to generate cover letter' }, { status: 500 })
  }
}

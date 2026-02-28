import { generateTargetedResumeWithAI, rewriteResumeBulletsWithAI } from '@/lib/ai-utils'
import { extractKeywordPhrases, splitLines, type ResumePayload } from '@/lib/resume-utils'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const role = String(body?.role || '').trim()
    const jobDescription = String(body?.jobDescription || '').trim()
    const resume = (body?.resume || null) as ResumePayload | null

    if (!role) {
      return Response.json({ error: 'Target role is required' }, { status: 400 })
    }

    if (!jobDescription) {
      return Response.json({ error: 'Job description is required' }, { status: 400 })
    }

    if (!resume) {
      return Response.json({ error: 'Resume payload is required' }, { status: 400 })
    }

    const generatedResume = await generateTargetedResumeWithAI({
      role,
      jobDescription,
      baseResume: resume,
    })

    const firstExperience = generatedResume.experience[0]
    if (firstExperience?.bullets?.trim()) {
      const rewrittenBullets = await rewriteResumeBulletsWithAI({
        role,
        jobDescription,
        bullets: splitLines(firstExperience.bullets),
      })
      generatedResume.experience[0] = {
        ...firstExperience,
        bullets: rewrittenBullets.join('\n'),
      }
    }

    return Response.json({
      resume: generatedResume,
      keywords: extractKeywordPhrases(jobDescription, 25),
    })
  } catch (error) {
    console.error('AI resume generation error:', error)
    return Response.json({ error: 'Failed to generate AI resume' }, { status: 500 })
  }
}

import { analyzeAtsWithAI, buildAtsSuggestions } from '@/lib/ai-utils'
import {
  calculateKeywordMatch,
  calculateResumeStructureScore,
  extractKeywordPhrases,
  extractKeywords,
  resumeToPlainText,
  splitSkills,
  type AtsAnalysisResult,
  type ResumePayload,
} from '@/lib/resume-utils'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const resume = (body?.resume || null) as ResumePayload | null
    const jobDescription = String(body?.jobDescription || '').trim()

    if (!resume) {
      return Response.json({ error: 'Resume data is required' }, { status: 400 })
    }

    if (!jobDescription) {
      return Response.json({ error: 'Job description is required' }, { status: 400 })
    }

    const resumeText = resumeToPlainText(resume)
    const singleWordKeywords = extractKeywords(jobDescription, 30)
    const phraseKeywords = extractKeywordPhrases(jobDescription, 30)
    const extractedKeywords = Array.from(new Set([...singleWordKeywords, ...phraseKeywords])).slice(0, 30)
    const heuristicKeywordMatch = calculateKeywordMatch(extractedKeywords, resumeText)
    const structureScore = calculateResumeStructureScore(resume)
    const skillsText = splitSkills(resume.skills).join(' ').toLowerCase()

    const aiAnalysis = await analyzeAtsWithAI({
      resumeText,
      jobDescription,
      knownKeywords: extractedKeywords,
    })

    const missingSkills = heuristicKeywordMatch.missingKeywords.filter(
      (keyword) => !skillsText.includes(keyword.toLowerCase()),
    )
    const matchPercentage = Math.round((aiAnalysis.matchPercentage * 0.65) + (heuristicKeywordMatch.matchPercentage * 0.35))
    const missingKeywords = Array.from(new Set([...aiAnalysis.missingKeywords, ...missingSkills])).slice(0, 20)
    const suggestions = Array.from(new Set([
      ...aiAnalysis.suggestions,
      ...buildAtsSuggestions({
        missingKeywords,
        structureScore,
        keywordMatch: heuristicKeywordMatch.matchPercentage,
      }),
    ])).slice(0, 8)

    const result: AtsAnalysisResult = {
      matchPercentage,
      missingKeywords,
      suggestions,
      extractedKeywords,
      breakdown: {
        keywordMatch: heuristicKeywordMatch.matchPercentage,
        structure: structureScore,
        missingSkillsCount: missingSkills.length,
      },
    }

    return Response.json(result)
  } catch (error) {
    console.error('ATS analysis error:', error)
    return Response.json({ error: 'Failed to analyze ATS match' }, { status: 500 })
  }
}

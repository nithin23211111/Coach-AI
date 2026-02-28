const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'have', 'in', 'is', 'it', 'its',
  'of', 'on', 'or', 'that', 'the', 'their', 'this', 'to', 'was', 'were', 'will', 'with', 'you', 'your',
  'our', 'job', 'role', 'team', 'work', 'years', 'year', 'plus',
])

const ATS_SECTIONS = ['summary', 'skills', 'experience', 'education', 'projects'] as const

const ACTION_VERBS = ['led', 'built', 'implemented', 'optimized', 'designed', 'developed', 'improved']

export type ATSScoreResult = {
  score: number
  keywordMatch: number
  missingKeywords: string[]
  sectionScore: number
  actionVerbScore: number
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 3 && !STOP_WORDS.has(word))
}

function extractKeywords(text: string): string[] {
  const set = new Set<string>()
  for (const token of tokenize(text)) {
    set.add(token)
  }
  return Array.from(set)
}

export function extractATSKeywords(text: string): string[] {
  return extractKeywords(text)
}

function scoreSections(resumeText: string): number {
  const lower = resumeText.toLowerCase()
  const present = ATS_SECTIONS.filter((section) => lower.includes(section)).length
  return Math.round((present / ATS_SECTIONS.length) * 100)
}

function scoreActionVerbs(resumeText: string): number {
  const lower = resumeText.toLowerCase()
  const matched = ACTION_VERBS.filter((verb) => {
    const regex = new RegExp(`\\b${verb}\\b`, 'i')
    return regex.test(lower)
  }).length
  return Math.round((matched / ACTION_VERBS.length) * 100)
}

export function calculateATSScore(resumeText: string, jobDescription: string): ATSScoreResult {
  const jdKeywords = extractKeywords(jobDescription)
  const resumeKeywords = new Set(extractKeywords(resumeText))

  const matchedKeywords = jdKeywords.filter((keyword) => resumeKeywords.has(keyword))
  const missingKeywords = jdKeywords.filter((keyword) => !resumeKeywords.has(keyword))
  const keywordMatch = jdKeywords.length
    ? Math.round((matchedKeywords.length / jdKeywords.length) * 100)
    : 0

  const sectionScore = scoreSections(resumeText)
  const actionVerbScore = scoreActionVerbs(resumeText)

  const score = Math.max(
    0,
    Math.min(
      100,
      Math.round((keywordMatch * 0.7) + (sectionScore * 0.2) + (actionVerbScore * 0.1)),
    ),
  )

  return {
    score,
    keywordMatch,
    missingKeywords: missingKeywords.slice(0, 10),
    sectionScore,
    actionVerbScore,
  }
}

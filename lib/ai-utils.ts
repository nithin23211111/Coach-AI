import type { SkillLensAnalysis, SkillLensInput } from '@/lib/skilllens'
import { calculateKeywordMatch, extractKeywordPhrases, splitLines, splitSkills, type ResumePayload } from '@/lib/resume-utils'

type APIProvider = 'gemini' | 'openai'

function getProvider(): APIProvider {
  if (process.env.GEMINI_API_KEY) return 'gemini'
  if (process.env.OPENAI_API_KEY) return 'openai'
  throw new Error('No API key configured. Set GEMINI_API_KEY or OPENAI_API_KEY')
}

export async function generateWithAI(prompt: string, system?: string): Promise<string> {
  const provider = getProvider()
  return provider === 'gemini' ? generateWithGemini(prompt, system) : generateWithOpenAI(prompt, system)
}

async function generateWithGemini(prompt: string, system?: string): Promise<string> {
  const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': process.env.GEMINI_API_KEY || '',
    },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: system ? `${system}\n\n${prompt}` : prompt }],
        },
      ],
    }),
  })

  const data = await response.json()
  return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
}

async function generateWithOpenAI(prompt: string, system?: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        ...(system ? [{ role: 'system', content: system }] : []),
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    }),
  })

  const data = await response.json()
  return data.choices?.[0]?.message?.content || ''
}

function cleanJsonPayload(raw: string): string {
  return raw.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim()
}

function parseJsonSafely<T>(raw: string): T | null {
  try {
    return JSON.parse(cleanJsonPayload(raw)) as T
  } catch {
    return null
  }
}

function sanitizeScore(value: unknown): number {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return 0
  return Math.max(0, Math.min(100, Math.round(numeric)))
}

function sanitizeStringArray(value: unknown, limit = 6): string[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => String(item).trim())
    .filter(Boolean)
    .slice(0, limit)
}

export async function evaluateInterviewAnswer(
  question: string,
  answer: string,
  mode: 'realistic' | 'coaching'
): Promise<{
  scores: Record<string, number>
  feedback: string
  strengths: string[]
  weaknesses: string[]
  improvementTips: string
}> {
  const systemPrompt =
    mode === 'realistic'
      ? `You are a professional interview evaluator.
Evaluate only the answer provided. Do not invent achievements or experiences.
Return ONLY strict valid JSON in this exact shape:
{
  "clarity_score": 0,
  "technical_score": 0,
  "structure_score": 0,
  "confidence_score": 0,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "improvement_tips": "..."
}
Rules:
- Scores must be integers 0-100
- strengths/weaknesses must be concise and evidence-based
- improvement_tips must be concise, professional, and actionable
- no markdown, no extra keys, no commentary`
      : `You are an interview coaching assistant.
Return ONLY strict valid JSON in this exact shape:
{
  "clarity_score": 0,
  "technical_score": 0,
  "structure_score": 0,
  "confidence_score": 0,
  "strengths": ["..."],
  "weaknesses": ["..."],
  "improvement_tips": "..."
}
Keep advice concise, professional, and grounded in the supplied answer only.`

  const prompt = `Question: ${question}\n\nCandidate's Answer: ${answer}`
  const response = await generateWithAI(prompt, systemPrompt)

  const parsed = parseJsonSafely<{
    clarity_score?: unknown
    technical_score?: unknown
    structure_score?: unknown
    confidence_score?: unknown
    strengths?: unknown
    weaknesses?: unknown
    improvement_tips?: unknown
    clarity?: unknown
    technicalDepth?: unknown
    structure?: unknown
    confidence?: unknown
    feedback?: unknown
  }>(response)

  const clarity = sanitizeScore(parsed?.clarity_score ?? parsed?.clarity)
  const technicalDepth = sanitizeScore(parsed?.technical_score ?? parsed?.technicalDepth)
  const structure = sanitizeScore(parsed?.structure_score ?? parsed?.structure)
  const confidence = sanitizeScore(parsed?.confidence_score ?? parsed?.confidence)
  const strengths = sanitizeStringArray(parsed?.strengths, 5)
  const weaknesses = sanitizeStringArray(parsed?.weaknesses, 5)
  const improvementTips = String(parsed?.improvement_tips ?? parsed?.feedback ?? '').trim()

  if (parsed) {
    return {
      scores: {
        clarity,
        technicalDepth,
        confidence,
        structure,
        communication: clarity,
        technical: technicalDepth,
        problemSolving: structure,
        leadership: confidence,
      },
      feedback: improvementTips,
      strengths,
      weaknesses,
      improvementTips,
    }
  }

  const fallbackTip = splitLines(response).slice(0, 2).join(' ').trim() || 'Provide clearer structure and role-specific technical depth in your answer.'
  return {
    scores: {
      clarity: 0,
      technicalDepth: 0,
      confidence: 0,
      structure: 0,
      communication: 0,
      technical: 0,
      problemSolving: 0,
      leadership: 0,
    },
    feedback: fallbackTip,
    strengths: [],
    weaknesses: [],
    improvementTips: fallbackTip,
  }
}

export async function analyzeSkillLensProfile(input: SkillLensInput): Promise<SkillLensAnalysis> {
  const systemPrompt = `You are SkillLens AI, a precise career upskilling strategist.
Return ONLY valid JSON with this exact structure:
{
  "summaryMessage": "string",
  "currentSkillSummary": "string",
  "skillGapAnalysis": ["string"],
  "roadmapStages": [
    {
      "stage": "Beginner|Intermediate|Advanced",
      "focus": "string",
      "timeframe": "string",
      "milestones": ["string"]
    }
  ],
  "highlyRecommendedCourses": [
    {
      "title": "string",
      "provider": "string",
      "url": "string",
      "pricing": "FREE|PAID",
      "reason": "string"
    }
  ],
  "additionalCourses": [
    {
      "title": "string",
      "provider": "string",
      "url": "string",
      "pricing": "FREE|PAID",
      "reason": "string"
    }
  ],
  "projects": [
    {
      "name": "string",
      "purpose": "string",
      "demonstratedSkills": ["string"],
      "difficulty": "Beginner|Intermediate|Advanced"
    }
  ]
}`

  const prompt = `Candidate profile:
- Current role/field of study: ${input.currentRoleOrField}
- Current skills: ${input.currentSkills.join(', ')}
- Experience level: ${input.experienceLevel}
- Target role: ${input.targetRole}`

  const response = await generateWithAI(prompt, systemPrompt)
  const generatedAt = new Date().toISOString()

  try {
    const parsed = JSON.parse(cleanJsonPayload(response))
    return {
      summaryMessage: typeof parsed?.summaryMessage === 'string' ? parsed.summaryMessage : 'Skill analysis generated.',
      currentSkillSummary: typeof parsed?.currentSkillSummary === 'string' ? parsed.currentSkillSummary : `${input.currentRoleOrField} profile with ${input.currentSkills.join(', ')}.`,
      skillGapAnalysis: Array.isArray(parsed?.skillGapAnalysis) ? parsed.skillGapAnalysis.filter((item: unknown) => typeof item === 'string') : [],
      roadmapStages: Array.isArray(parsed?.roadmapStages)
        ? parsed.roadmapStages.map((stage: any) => ({
            stage: stage.stage === 'Intermediate' || stage.stage === 'Advanced' ? stage.stage : 'Beginner',
            focus: typeof stage.focus === 'string' ? stage.focus : '',
            timeframe: typeof stage.timeframe === 'string' ? stage.timeframe : '',
            milestones: Array.isArray(stage.milestones) ? stage.milestones.filter((item: unknown) => typeof item === 'string') : [],
          }))
        : [],
      highlyRecommendedCourses: Array.isArray(parsed?.highlyRecommendedCourses)
        ? parsed.highlyRecommendedCourses.map((course: any) => ({
            title: typeof course.title === 'string' ? course.title : 'Untitled Course',
            provider: typeof course.provider === 'string' ? course.provider : 'Unknown Provider',
            url: typeof course.url === 'string' ? course.url : '',
            pricing: course.pricing === 'PAID' ? 'PAID' : 'FREE',
            reason: typeof course.reason === 'string' ? course.reason : '',
          }))
        : [],
      additionalCourses: Array.isArray(parsed?.additionalCourses)
        ? parsed.additionalCourses.map((course: any) => ({
            title: typeof course.title === 'string' ? course.title : 'Untitled Course',
            provider: typeof course.provider === 'string' ? course.provider : 'Unknown Provider',
            url: typeof course.url === 'string' ? course.url : '',
            pricing: course.pricing === 'PAID' ? 'PAID' : 'FREE',
            reason: typeof course.reason === 'string' ? course.reason : '',
          }))
        : [],
      projects: Array.isArray(parsed?.projects)
        ? parsed.projects.map((project: any) => ({
            name: typeof project.name === 'string' ? project.name : 'Untitled Project',
            purpose: typeof project.purpose === 'string' ? project.purpose : '',
            demonstratedSkills: Array.isArray(project.demonstratedSkills) ? project.demonstratedSkills.filter((item: unknown) => typeof item === 'string') : [],
            difficulty: project.difficulty === 'Intermediate' || project.difficulty === 'Advanced' ? project.difficulty : 'Beginner',
          }))
        : [],
      generatedAt,
    }
  } catch {
    return {
      summaryMessage: `You currently have core skills in ${input.currentSkills.join(', ')} and need focused upskilling for ${input.targetRole}.`,
      currentSkillSummary: `${input.experienceLevel} ${input.currentRoleOrField} profile with transferable skills in ${input.currentSkills.join(', ')}.`,
      skillGapAnalysis: ['Depth in target-role tooling', 'Portfolio-ready implementation experience', 'Advanced architecture and delivery practices'],
      roadmapStages: [],
      highlyRecommendedCourses: [],
      additionalCourses: [],
      projects: [],
      generatedAt,
    }
  }
}

export async function improveBulletPoint(bullet: string): Promise<string> {
  const systemPrompt = `You are a resume writing expert. Improve the resume bullet point to be more impactful, quantifiable, and achievement-focused. Return only the improved bullet point.`
  return generateWithAI(bullet, systemPrompt)
}

export async function generateResumeSuggestions(input: {
  kind: 'summary' | 'bullets'
  role: string
  title?: string
  company?: string
  summary?: string
  responsibilities?: string
}): Promise<{ summary?: string; bullets?: string[] }> {
  if (input.kind === 'summary') {
    const summary = await generateWithAI(`Role/Target Title: ${input.role}\nCurrent notes: ${input.summary || 'N/A'}`, 'Write one concise ATS-friendly summary in 2-4 lines.')
    return { summary: summary.trim() }
  }

  const response = await generateWithAI(
    `Target role: ${input.role}\nJob title: ${input.title || 'N/A'}\nCompany: ${input.company || 'N/A'}\nResponsibilities: ${input.responsibilities || 'N/A'}`,
    'Generate exactly 4 action-oriented bullets. Return only JSON: {"bullets":["...","...","...","..."]}'
  )

  try {
    const parsed = JSON.parse(cleanJsonPayload(response))
    const bullets = Array.isArray(parsed?.bullets) ? parsed.bullets.map((item: string) => item.trim()).filter(Boolean).slice(0, 4) : []
    return { bullets }
  } catch {
    return { bullets: splitLines(response).slice(0, 4) }
  }
}

export async function analyzeAtsWithAI(input: {
  resumeText: string
  jobDescription: string
  knownKeywords: string[]
}): Promise<{ matchPercentage: number; missingKeywords: string[]; suggestions: string[] }> {
  const systemPrompt = `You are an ATS optimization assistant.
Compare a resume against a job description and return ONLY valid JSON:
{
  "matchPercentage": 0,
  "missingKeywords": ["keyword1", "keyword2"],
  "suggestions": ["improvement 1", "improvement 2", "improvement 3"]
}`

  const response = await generateWithAI(
    `Job Description:\n${input.jobDescription}\n\nResume:\n${input.resumeText}\n\nKnown extracted job keywords:\n${input.knownKeywords.join(', ')}`,
    systemPrompt,
  )

  try {
    const parsed = JSON.parse(cleanJsonPayload(response))
    const matchPercentage = Number.isFinite(parsed?.matchPercentage) ? Math.max(0, Math.min(100, Math.round(parsed.matchPercentage))) : 0
    const missingKeywords = Array.isArray(parsed?.missingKeywords) ? parsed.missingKeywords.map((item: string) => item.trim()).filter(Boolean).slice(0, 20) : []
    const suggestions = Array.isArray(parsed?.suggestions) ? parsed.suggestions.map((item: string) => item.trim()).filter(Boolean).slice(0, 8) : []
    return { matchPercentage, missingKeywords, suggestions }
  } catch {
    return {
      matchPercentage: 0,
      missingKeywords: input.knownKeywords.slice(0, 10),
      suggestions: ['Add missing role-specific keywords to your summary and recent experience bullets.'],
    }
  }
}

export async function rewriteResumeBulletsWithAI(input: { role: string; jobDescription: string; bullets: string[] }): Promise<string[]> {
  const response = await generateWithAI(
    `Role: ${input.role}\nJob Description:\n${input.jobDescription || 'N/A'}\n\nBullets:\n${input.bullets.join('\n')}`,
    `You are an ATS resume rewriting assistant.
Rewrite the experience bullet points to:
- use strong action verbs
- include measurable outcomes where supported by the source text
- align keywords with the provided job description
- avoid hallucinated technologies, numbers, titles, or outcomes
Return ONLY strict valid JSON: {"bullets":["..."]}`
  )
  const parsed = parseJsonSafely<{ bullets?: unknown }>(response)
  if (parsed?.bullets && Array.isArray(parsed.bullets)) {
    return parsed.bullets.map((item) => String(item).trim()).filter(Boolean).slice(0, input.bullets.length || 4)
  }
  return input.bullets.map((bullet) => bullet.trim()).filter(Boolean).slice(0, input.bullets.length || 4)
}

export async function generateTargetedResumeWithAI(input: { role: string; jobDescription: string; baseResume: ResumePayload }): Promise<ResumePayload> {
  const jobKeywords = extractKeywordPhrases(input.jobDescription, 30)
  const response = await generateWithAI(
    `Target Role: ${input.role}\nExtracted Keywords: ${jobKeywords.join(', ')}\nJob Description:\n${input.jobDescription}\n\nBase Resume Summary:\n${input.baseResume.summary}\n\nBase Skills:\n${input.baseResume.skills}`,
    'Return JSON with summary, skills(array), experienceBullets(array), projects(array), certifications(array).'
  )

  try {
    const parsed = JSON.parse(cleanJsonPayload(response))
    const nextExperience = [...input.baseResume.experience]
    const bullets = Array.isArray(parsed?.experienceBullets) ? parsed.experienceBullets.map((item: string) => item.trim()).filter(Boolean) : []
    if (nextExperience.length > 0 && bullets.length) {
      nextExperience[0] = { ...nextExperience[0], bullets: bullets.join('\n') }
    }
    return {
      ...input.baseResume,
      role: input.role,
      summary: typeof parsed?.summary === 'string' && parsed.summary.trim() ? parsed.summary.trim() : input.baseResume.summary,
      skills: Array.isArray(parsed?.skills) ? parsed.skills.map((item: string) => item.trim()).filter(Boolean).join(', ') : input.baseResume.skills,
      experience: nextExperience,
      projects: Array.isArray(parsed?.projects) && parsed.projects.length ? parsed.projects.map((project: any) => ({ name: String(project?.name || ''), description: String(project?.description || ''), tech: String(project?.tech || ''), link: String(project?.link || '') })) : input.baseResume.projects,
      certifications: Array.isArray(parsed?.certifications) && parsed.certifications.length ? parsed.certifications.map((cert: any) => ({ name: String(cert?.name || ''), issuer: String(cert?.issuer || ''), year: String(cert?.year || '') })) : input.baseResume.certifications,
    }
  } catch {
    return input.baseResume
  }
}

export async function generateInterviewImprovementTips(input: { role: string; weaknesses: string[]; latestFeedback: string }): Promise<string[]> {
  const response = await generateWithAI(
    `Role: ${input.role}\nWeak areas: ${input.weaknesses.join(', ') || 'None'}\nLatest feedback:\n${input.latestFeedback}`,
    'Provide 4 concise improvement tips. Return JSON: {"tips":["...","...","...","..."]}'
  )
  try {
    const parsed = JSON.parse(cleanJsonPayload(response))
    return Array.isArray(parsed?.tips) ? parsed.tips.map((item: string) => item.trim()).filter(Boolean).slice(0, 4) : []
  } catch {
    return splitLines(response).slice(0, 4)
  }
}

export function buildAtsSuggestions(input: { missingKeywords: string[]; structureScore: number; keywordMatch: number }): string[] {
  const suggestions: string[] = []
  if (input.keywordMatch < 70) suggestions.push('Increase keyword alignment by including role terms in summary and top experience bullets.')
  if (input.missingKeywords.length) suggestions.push(`Add these missing skills/keywords where true: ${input.missingKeywords.slice(0, 8).join(', ')}.`)
  if (input.structureScore < 85) suggestions.push('Complete ATS sections: Summary, Skills, Experience, Projects, Education, Certifications.')
  if (!suggestions.length) suggestions.push('Strong ATS alignment. Keep tailoring bullets with quantified outcomes.')
  return suggestions
}

export function buildKeywordUsageScore(answer: string, role: string): number {
  const roleKeywords = extractKeywordPhrases(role, 8)
  const answerKeywords = extractKeywordPhrases(answer, 20)
  const match = calculateKeywordMatch(roleKeywords, answerKeywords.join(' '))
  return Math.max(20, match.matchPercentage)
}

export async function generateCoverLetterWithAI(input: {
  companyName: string
  jobTitle: string
  role: string
  summary: string
  skills: string
  experience: string
  jobDescription?: string
}): Promise<string> {
  const systemPrompt = `You are a professional career writing assistant.
Write a concise, polished cover letter with this structure:
1) Greeting
2) Opening paragraph
3) Body paragraph focused on impact and relevance
4) Closing paragraph with call to action`

  const prompt = `Company: ${input.companyName}
Job Title: ${input.jobTitle}
Target Role: ${input.role}
Summary: ${input.summary}
Skills: ${input.skills}
Experience Highlights: ${input.experience}
Job Description (optional): ${input.jobDescription || 'N/A'}`

  const content = await generateWithAI(prompt, systemPrompt)
  return content.trim()
}

export async function rewriteResumeTextWithAI(input: {
  mode: 'improve' | 'ats' | 'stronger'
  role: string
  sourceText: string
}): Promise<string> {
  const instruction = input.mode === 'ats'
    ? 'Rewrite this text to be ATS optimized with keyword relevance and concise impact.'
    : input.mode === 'stronger'
      ? 'Rewrite this text with stronger action verbs, clearer achievements, and professional polish.'
      : 'Improve this text for clarity, professionalism, and measurable impact.'

  const rewritten = await generateWithAI(
    `Target role: ${input.role || 'Professional'}
Instruction: ${instruction}
Job description/context and source content:
${input.sourceText}`,
    `You are a premium ATS resume rewriting assistant.
If the content is experience bullets, rewrite with measurable metrics, strong action verbs, and job-description keyword alignment.
Do not fabricate numbers, tools, or achievements.
Keep output concise and professional.
Return ONLY strict valid JSON: {"rewritten_text":"..."}`
  )

  const parsed = parseJsonSafely<{ rewritten_text?: unknown }>(rewritten)
  if (parsed?.rewritten_text) {
    return String(parsed.rewritten_text).trim()
  }

  return input.sourceText.trim()
}

export async function generateInterviewQuestion(role: string, previousQuestions: string[] = [], useFallbackVariation = false): Promise<string> {
  const previousQuestionsText = previousQuestions.length ? previousQuestions.slice(0, 30).join(', ') : 'None'
  const fallbackInstruction = useFallbackVariation ? 'Generate a clearly different variation.' : ''
  const prompt = `Create one high-quality interview question for ${role}. Return only the question text.`
  const question = await generateWithAI(prompt, `Generate a new interview question for role ${role}. Avoid repeating: ${previousQuestionsText}. ${fallbackInstruction}`)
  return question.trim()
}

export async function generateInsights(industry: string): Promise<{
  marketOutlook: string
  growthPercentage: number
  demandLevel: string
  avgSalary: number
  topSkills: string[]
}> {
  const response = await generateWithAI(
    `Analyze the current market for the ${industry} industry. Provide realistic insights.`,
    `You are an industry analyst. Provide market insights for the ${industry} industry. Return JSON with: marketOutlook, growthPercentage, demandLevel, avgSalary, topSkills`
  )

  try {
    const parsed = JSON.parse(response)
    return {
      marketOutlook: parsed.marketOutlook || 'Positive',
      growthPercentage: parsed.growthPercentage || 15,
      demandLevel: parsed.demandLevel || 'High',
      avgSalary: parsed.avgSalary || 120000,
      topSkills: parsed.topSkills || ['Leadership', 'Communication', 'Technical Skills'],
    }
  } catch {
    return {
      marketOutlook: 'Positive',
      growthPercentage: 15,
      demandLevel: 'High',
      avgSalary: 120000,
      topSkills: ['Leadership', 'Communication', 'Problem Solving'],
    }
  }
}

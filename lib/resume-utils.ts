export type ExperienceItem = {
  company: string
  title: string
  duration: string
  location: string
  bullets: string
}

export type EducationItem = {
  school: string
  degree: string
  field: string
  year: string
}

export type CertificationItem = {
  name: string
  issuer: string
  year: string
}

export type ProjectItem = {
  name: string
  description: string
  tech: string
  link: string
}

export type OptionalSectionItem = {
  title: string
  content: string
}

export type ResumePayload = {
  fullName: string
  email: string
  phone: string
  location: string
  website: string
  role: string
  summary: string
  experience: ExperienceItem[]
  skills: string
  education: EducationItem[]
  certifications: CertificationItem[]
  projects: ProjectItem[]
  optionalSections: OptionalSectionItem[]
}

export type AtsScoreBreakdown = {
  keywordMatch: number
  structure: number
  missingSkillsCount: number
}

export type AtsAnalysisResult = {
  matchPercentage: number
  missingKeywords: string[]
  suggestions: string[]
  extractedKeywords: string[]
  breakdown: AtsScoreBreakdown
}

const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'to', 'for', 'from', 'in', 'on', 'of', 'at', 'by', 'with',
  'as', 'is', 'are', 'be', 'been', 'this', 'that', 'these', 'those', 'your', 'you', 'our',
  'we', 'will', 'can', 'must', 'should', 'may', 'not', 'have', 'has', 'had', 'it', 'its',
  'role', 'job', 'position', 'work', 'team', 'experience', 'years', 'year', 'plus',
])

export function createEmptyResume(): ResumePayload {
  return {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    role: '',
    summary: '',
    experience: [{ company: '', title: '', duration: '', location: '', bullets: '' }],
    skills: '',
    education: [{ school: '', degree: '', field: '', year: '' }],
    certifications: [{ name: '', issuer: '', year: '' }],
    projects: [{ name: '', description: '', tech: '', link: '' }],
    optionalSections: [{ title: 'Additional Information', content: '' }],
  }
}

export function splitLines(value: string): string[] {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

export function splitSkills(value: string): string[] {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
}

export function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9+#.\-]/g, '').trim()
}

export function extractKeywordPhrases(text: string, limit = 40): string[] {
  const cleaned = text
    .replace(/\r/g, '\n')
    .replace(/[^\w\s+#.\-]/g, ' ')
    .toLowerCase()
  const tokens = cleaned.split(/\s+/).map((token) => token.trim()).filter(Boolean)
  const counts = new Map<string, number>()

  for (let index = 0; index < tokens.length; index += 1) {
    const unigram = tokens[index]
    if (unigram.length > 2 && !STOP_WORDS.has(unigram)) {
      counts.set(unigram, (counts.get(unigram) || 0) + 1)
    }

    const bigram = `${tokens[index]} ${tokens[index + 1] || ''}`.trim()
    const [first, second] = bigram.split(' ')
    if (
      first &&
      second &&
      first.length > 2 &&
      second.length > 2 &&
      !STOP_WORDS.has(first) &&
      !STOP_WORDS.has(second)
    ) {
      counts.set(bigram, (counts.get(bigram) || 0) + 1)
    }
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .map(([keyword]) => keyword)
    .slice(0, limit)
}

export function calculateKeywordMatch(jobKeywords: string[], resumeText: string) {
  const normalizedResume = normalizeToken(resumeText)
  if (!jobKeywords.length) {
    return {
      matchPercentage: 0,
      matchedKeywords: [] as string[],
      missingKeywords: [] as string[],
    }
  }

  const matchedKeywords: string[] = []
  const missingKeywords: string[] = []

  for (const keyword of jobKeywords) {
    const normalizedKeyword = normalizeToken(keyword)
    if (!normalizedKeyword) continue
    if (normalizedResume.includes(normalizedKeyword)) {
      matchedKeywords.push(keyword)
    } else {
      missingKeywords.push(keyword)
    }
  }

  const matchPercentage = Math.round((matchedKeywords.length / Math.max(1, matchedKeywords.length + missingKeywords.length)) * 100)
  return {
    matchPercentage,
    matchedKeywords,
    missingKeywords,
  }
}

export function calculateResumeStructureScore(resume: ResumePayload): number {
  const checks = [
    Boolean(resume.summary.trim()),
    resume.experience.some((item) => item.title.trim() && item.company.trim() && item.bullets.trim()),
    Boolean(splitSkills(resume.skills).length),
    resume.projects.some((item) => item.name.trim() && item.description.trim()),
    resume.education.some((item) => item.school.trim() && item.degree.trim()),
    resume.certifications.some((item) => item.name.trim()),
  ]

  const completed = checks.filter(Boolean).length
  return Math.round((completed / checks.length) * 100)
}

export function resumeToPlainText(resume: ResumePayload): string {
  const parts: string[] = []

  parts.push(resume.fullName, resume.email, resume.phone, resume.location, resume.website, resume.role, resume.summary)

  for (const exp of resume.experience) {
    parts.push(exp.title, exp.company, exp.duration, exp.location, exp.bullets)
  }

  parts.push(resume.skills)

  for (const edu of resume.education) {
    parts.push(edu.school, edu.degree, edu.field, edu.year)
  }

  for (const cert of resume.certifications) {
    parts.push(cert.name, cert.issuer, cert.year)
  }

  for (const project of resume.projects) {
    parts.push(project.name, project.description, project.tech, project.link)
  }

  for (const section of resume.optionalSections) {
    parts.push(section.title, section.content)
  }

  return parts
    .filter(Boolean)
    .join('\n')
    .trim()
}

export function extractKeywords(text: string, limit = 30): string[] {
  const counts = new Map<string, number>()

  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word))

  for (const word of words) {
    counts.set(word, (counts.get(word) || 0) + 1)
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map((entry) => entry[0])
}

export function parseResumeImport(raw: string): Partial<ResumePayload> {
  const cleaned = raw.replace(/\r/g, '').trim()

  try {
    const parsed = JSON.parse(cleaned) as Partial<ResumePayload>
    if (parsed && typeof parsed === 'object') {
      const empty = createEmptyResume()
      return {
        ...empty,
        ...parsed,
        experience: Array.isArray(parsed.experience) && parsed.experience.length ? parsed.experience : empty.experience,
        education: Array.isArray(parsed.education) && parsed.education.length ? parsed.education : empty.education,
        certifications: Array.isArray(parsed.certifications) && parsed.certifications.length ? parsed.certifications : empty.certifications,
        projects: Array.isArray(parsed.projects) && parsed.projects.length ? parsed.projects : empty.projects,
        optionalSections: Array.isArray(parsed.optionalSections) && parsed.optionalSections.length ? parsed.optionalSections : empty.optionalSections,
      }
    }
  } catch {
    // Continue with text parsing.
  }

  const lines = cleaned
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  const email = cleaned.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] || ''
  const phone = cleaned.match(/(?:\+?\d{1,2}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}/)?.[0] || ''

  const summaryIndex = lines.findIndex((line) => /summary|profile|objective/i.test(line))
  const experienceIndex = lines.findIndex((line) => /experience|employment/i.test(line))

  const summary =
    summaryIndex >= 0
      ? lines
          .slice(summaryIndex + 1, experienceIndex > summaryIndex ? experienceIndex : summaryIndex + 5)
          .join(' ')
      : ''

  const skillsLine = lines.find((line) => /^skills\s*[:|-]/i.test(line))
  const roleLine = lines.find((line) => /(title|role|position)\s*[:|-]/i.test(line))

  return {
    fullName: lines[0] || '',
    email,
    phone,
    role: roleLine ? roleLine.split(/[:|-]/).slice(1).join(' ').trim() : '',
    summary,
    skills: skillsLine ? skillsLine.split(/[:|-]/).slice(1).join(' ').trim() : '',
    experience: [{ company: '', title: '', duration: '', location: '', bullets: '' }],
  }
}

export function buildWordHtml(resume: ResumePayload): string {
  const skills = splitSkills(resume.skills)

  const experienceHtml = resume.experience
    .filter((item) => item.company || item.title || item.bullets)
    .map((item) => {
      const bullets = splitLines(item.bullets).map((bullet) => `<li>${bullet}</li>`).join('')
      return `<p><b>${item.title}</b> ${item.company ? `| ${item.company}` : ''} ${item.duration ? `| ${item.duration}` : ''}</p><ul>${bullets}</ul>`
    })
    .join('')

  return `
<html>
  <head><meta charset="utf-8" /></head>
  <body>
    <h1>${resume.fullName || 'Resume'}</h1>
    <p>${[resume.email, resume.phone, resume.location, resume.website].filter(Boolean).join(' | ')}</p>
    ${resume.summary ? `<h3>Professional Summary</h3><p>${resume.summary}</p>` : ''}
    ${experienceHtml ? `<h3>Work Experience</h3>${experienceHtml}` : ''}
    ${skills.length ? `<h3>Skills</h3><p>${skills.join(', ')}</p>` : ''}
  </body>
</html>
`
}

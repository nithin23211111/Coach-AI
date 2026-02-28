'use client'

import { FormEvent, useMemo, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useAccessControl } from '@/hooks/use-access-control'
import { LimitReachedModal } from '@/components/limit-reached-modal'
import { supabase } from '@/lib/supabase'

type ExperienceLevel = 'Beginner' | 'Intermediate' | 'Advanced'

type CourseItem = {
  title: string
  platform: string
  url: string
}

type SkillLensResponse = {
  summary: string
  skillGaps: string[]
  roadmap: {
    shortTerm: string[]
    midTerm: string[]
    longTerm: string[]
  }
  projects: string[]
  courses: {
    free: CourseItem[]
    paid: CourseItem[]
  }
  certifications: string[]
  higherStudies: string[]
}

type SkillLensInvokeResponse = SkillLensResponse & {
  error?: string
}

const SKILL_SUGGESTIONS = [
  'JavaScript',
  'TypeScript',
  'React',
  'Node.js',
  'Python',
  'SQL',
  'AWS',
  'Docker',
  'System Design',
  'Data Structures',
]

function parseSkillLensResponse(data: unknown): SkillLensResponse | null {
  if (!data || typeof data !== 'object') return null
  const payload = data as SkillLensResponse

  const isCourseArray = (value: unknown): value is CourseItem[] =>
    Array.isArray(value)
    && value.every((item) =>
      item
      && typeof item === 'object'
      && typeof (item as CourseItem).title === 'string'
      && typeof (item as CourseItem).platform === 'string'
      && typeof (item as CourseItem).url === 'string')

  const isStringArray = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every((item) => typeof item === 'string')

  if (
    typeof payload.summary !== 'string'
    || !isStringArray(payload.skillGaps)
    || !payload.roadmap
    || !isStringArray(payload.roadmap.shortTerm)
    || !isStringArray(payload.roadmap.midTerm)
    || !isStringArray(payload.roadmap.longTerm)
    || !isStringArray(payload.projects)
    || !payload.courses
    || !isCourseArray(payload.courses.free)
    || !isCourseArray(payload.courses.paid)
    || !isStringArray(payload.certifications)
    || !isStringArray(payload.higherStudies)
  ) {
    return null
  }

  return payload
}

export function SkillLensClient() {
  const [currentRole, setCurrentRole] = useState('')
  const [targetRole, setTargetRole] = useState('')
  const [currentSkillsInput, setCurrentSkillsInput] = useState('')
  const [selectedSkills, setSelectedSkills] = useState<string[]>([])
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('Beginner')
  const [analysis, setAnalysis] = useState<SkillLensResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const {
    isAuthenticated,
    usage,
    limits,
    consume,
    limitReachedFeature,
    closeLimitModal,
  } = useAccessControl()

  const parsedInputSkills = useMemo(
    () =>
      currentSkillsInput
        .split(',')
        .map((skill) => skill.trim())
        .filter(Boolean),
    [currentSkillsInput]
  )

  const combinedSkills = useMemo(() => {
    return Array.from(new Set([...parsedInputSkills, ...selectedSkills]))
  }, [parsedInputSkills, selectedSkills])

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((item) => item !== skill) : [...prev, skill]
    )
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')

    if (!currentRole.trim() || !targetRole.trim()) {
      setError('Please enter both current role and target role.')
      return
    }

    if (combinedSkills.length === 0) {
      setError('Please include at least one current skill.')
      return
    }

    const canProceed = await consume('skilllens_roadmaps')
    if (!canProceed) {
      return
    }

    setIsLoading(true)
    try {
      const { data, error: invokeError } = await supabase.functions.invoke<SkillLensInvokeResponse>('skilllens-analysis', {
        body: {
          currentRole: currentRole.trim(),
          targetRole: targetRole.trim(),
          currentSkills: combinedSkills,
          experienceLevel,
        },
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        },
      })

      if (invokeError) {
        setError(invokeError.message || 'Unable to analyze skills.')
        return
      }

      if (data?.error) {
        setError(data.error)
        return
      }

      const parsed = parseSkillLensResponse(data)
      if (!parsed) {
        setError('SkillLens returned an invalid response format.')
        return
      }

      setAnalysis(parsed)
    } catch (submissionError) {
      console.error('SkillLens analysis failed:', submissionError)
      setError(
        submissionError instanceof Error && submissionError.message.trim()
          ? submissionError.message
          : 'Unable to generate SkillLens analysis right now.'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-foreground">Coach AI</span>
          </Link>
          <Button variant="ghost" asChild>
            <Link href="/">Back Home</Link>
          </Button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {!isAuthenticated && (
          <Card className="border-[#1e3a32] bg-[#0f1f1b] p-4 text-[#F3F4F6]">
            <p className="text-sm font-medium">
              Guest usage this 24-hour window: {usage.skilllens_roadmaps}/{limits.skilllens_roadmaps} analyses.
            </p>
            <p className="text-xs text-[#9db6ad]">Create an account to save generated roadmaps in your dashboard.</p>
          </Card>
        )}

        <Card className="border-[#1f3d34] bg-gradient-to-br from-[#102720] via-[#0d1e19] to-[#0b1613] p-6 sm:p-8">
          <div className="space-y-3 mb-6">
            <h1 className="text-3xl font-bold text-[#F3F4F6]">SkillLens AI</h1>
            <p className="text-sm text-[#9db6ad]">
              Generate a personalized AI skill analysis, roadmap, course plan, and project path.
            </p>
            <div className="rounded-lg border border-[#24453b] bg-[#0f221c] p-4">
              <h2 className="text-lg font-semibold text-[#F3F4F6]">What is SkillLens?</h2>
              <p className="mt-2 text-sm text-[#cde0d8]">
                SkillLens analyzes your current role, skills, and experience level to generate a structured career roadmap toward your target role.
                It identifies skill gaps, recommends projects, suggests free and paid courses, and provides a step-by-step growth plan.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#cde0d8]">Current Role or Field of Study</label>
                <Input
                  value={currentRole}
                  onChange={(event) => setCurrentRole(event.target.value)}
                  placeholder="e.g. CS Student, QA Engineer, Frontend Developer"
                  className="border-[#27483f] bg-[#10221d] text-[#F3F4F6]"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#cde0d8]">Target Role</label>
                <Input
                  value={targetRole}
                  onChange={(event) => setTargetRole(event.target.value)}
                  placeholder="e.g. ML Engineer, Senior Backend Engineer"
                  className="border-[#27483f] bg-[#10221d] text-[#F3F4F6]"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#cde0d8]">Current Skills (comma-separated)</label>
              <Input
                value={currentSkillsInput}
                onChange={(event) => setCurrentSkillsInput(event.target.value)}
                placeholder="React, TypeScript, SQL"
                className="border-[#27483f] bg-[#10221d] text-[#F3F4F6]"
              />
              <div className="flex flex-wrap gap-2 pt-1">
                {SKILL_SUGGESTIONS.map((skill) => {
                  const isSelected = selectedSkills.includes(skill)
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                        isSelected
                          ? 'border-[#6B1F2A] bg-[#173c31] text-[#dff7ee]'
                          : 'border-[#2b4a41] bg-[#112620] text-[#9db6ad] hover:text-[#dff7ee]'
                      }`}
                    >
                      {skill}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[#cde0d8]">Experience Level</label>
              <div className="flex flex-wrap gap-2">
                {(['Beginner', 'Intermediate', 'Advanced'] as ExperienceLevel[]).map((level) => (
                  <button
                    key={level}
                    type="button"
                    onClick={() => setExperienceLevel(level)}
                    className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${
                      experienceLevel === level
                        ? 'border-[#6B1F2A] bg-[#173c31] text-[#F3F4F6]'
                        : 'border-[#2b4a41] bg-[#112620] text-[#9db6ad] hover:text-[#F3F4F6]'
                    }`}
                  >
                    {level}
                  </button>
                ))}
              </div>
            </div>

            {error && <p className="text-sm text-red-300">{error}</p>}

            <Button type="submit" size="lg" disabled={isLoading} className="bg-[#1f8a63] hover:bg-[#227b5c]">
              {isLoading ? 'Generating AI Analysis...' : 'Analyze Skills with AI'}
            </Button>
          </form>
        </Card>

        {analysis && (
          <Card className="border-[#24453b] bg-[#0f221c] p-6 space-y-6">
            <h2 className="text-2xl font-semibold text-[#F3F4F6]">SkillLens Result</h2>

            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[#F3F4F6]">Personalized Summary</h3>
              <p className="text-sm text-[#cde0d8]">{analysis.summary}</p>
            </div>

            <div className="border-t border-[#2b4b41] pt-5 space-y-2">
              <h3 className="text-lg font-semibold text-[#F3F4F6]">Skill Gap Analysis</h3>
              <ul className="space-y-1 text-sm text-[#cde0d8]">
                {analysis.skillGaps.map((item, index) => (
                  <li key={`${item}-${index}`}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className="border-t border-[#2b4b41] pt-5 space-y-3">
              <h3 className="text-lg font-semibold text-[#F3F4F6]">Roadmap</h3>
              <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-[#2b4b41] bg-[#122a23] p-4 space-y-2">
                  <h4 className="font-semibold text-[#F3F4F6]">Short Term</h4>
                  <ul className="space-y-1 text-sm text-[#cde0d8]">
                    {analysis.roadmap.shortTerm.map((item, index) => (
                      <li key={`st-${index}`}>• {item}</li>
                    ))}
                  </ul>
                </Card>
                <Card className="border-[#2b4b41] bg-[#122a23] p-4 space-y-2">
                  <h4 className="font-semibold text-[#F3F4F6]">Mid Term</h4>
                  <ul className="space-y-1 text-sm text-[#cde0d8]">
                    {analysis.roadmap.midTerm.map((item, index) => (
                      <li key={`mt-${index}`}>• {item}</li>
                    ))}
                  </ul>
                </Card>
                <Card className="border-[#2b4b41] bg-[#122a23] p-4 space-y-2">
                  <h4 className="font-semibold text-[#F3F4F6]">Long Term</h4>
                  <ul className="space-y-1 text-sm text-[#cde0d8]">
                    {analysis.roadmap.longTerm.map((item, index) => (
                      <li key={`lt-${index}`}>• {item}</li>
                    ))}
                  </ul>
                </Card>
              </div>
            </div>

            <div className="border-t border-[#2b4b41] pt-5 space-y-2">
              <h3 className="text-lg font-semibold text-[#F3F4F6]">Recommended Projects</h3>
              <ul className="space-y-1 text-sm text-[#cde0d8]">
                {analysis.projects.map((project, index) => (
                  <li key={`${project}-${index}`}>• {project}</li>
                ))}
              </ul>
            </div>

            <div className="border-t border-[#2b4b41] pt-5 space-y-4">
              <h3 className="text-lg font-semibold text-[#F3F4F6]">Courses</h3>

              <div className="space-y-3">
                <h4 className="font-semibold text-[#cde0d8]">Free</h4>
                {analysis.courses.free.map((course, index) => (
                  <Card key={`free-${course.title}-${index}`} className="border-[#2b4b41] bg-[#122a23] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-semibold text-[#F3F4F6]">{course.title}</p>
                        <p className="text-sm text-[#9db6ad]">{course.platform}</p>
                        <a
                          href={course.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block text-sm text-[#63d0a3] hover:text-[#8ef0c5]"
                        >
                          {course.url}
                        </a>
                      </div>
                      <Badge className="bg-[#1d4f3c] text-[#dff7ee] border border-[#2f6d58]">FREE</Badge>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-[#cde0d8]">Paid</h4>
                {analysis.courses.paid.map((course, index) => (
                  <Card key={`paid-${course.title}-${index}`} className="border-[#2b4b41] bg-[#122a23] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <p className="font-semibold text-[#F3F4F6]">{course.title}</p>
                        <p className="text-sm text-[#9db6ad]">{course.platform}</p>
                        <a
                          href={course.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block text-sm text-[#63d0a3] hover:text-[#8ef0c5]"
                        >
                          {course.url}
                        </a>
                      </div>
                      <Badge className="bg-[#4d3b1a] text-[#ffe7b6] border border-[#7a5d2b]">PAID</Badge>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            <div className="border-t border-[#2b4b41] pt-5 space-y-2">
              <h3 className="text-lg font-semibold text-[#F3F4F6]">Certifications</h3>
              <ul className="space-y-1 text-sm text-[#cde0d8]">
                {analysis.certifications.map((item, index) => (
                  <li key={`${item}-${index}`}>• {item}</li>
                ))}
              </ul>
            </div>

            <div className="border-t border-[#2b4b41] pt-5 space-y-2">
              <h3 className="text-lg font-semibold text-[#F3F4F6]">Degree / Higher Studies Suggestions</h3>
              <ul className="space-y-1 text-sm text-[#cde0d8]">
                {analysis.higherStudies.map((item, index) => (
                  <li key={`${item}-${index}`}>• {item}</li>
                ))}
              </ul>
            </div>
          </Card>
        )}
      </div>

      <LimitReachedModal
        open={Boolean(limitReachedFeature)}
        feature={limitReachedFeature}
        onOpenChange={(open) => {
          if (!open) closeLimitModal()
        }}
      />
    </div>
  )
}

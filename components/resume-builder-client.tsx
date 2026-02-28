'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { FileDown } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { useAccessControl } from '@/hooks/use-access-control'
import { getGuestIdClient } from '@/lib/guest-id'
import {
  buildWordHtml,
  createEmptyResume,
  resumeToPlainText,
  splitLines,
  splitSkills,
  type CertificationItem,
  type EducationItem,
  type ExperienceItem,
  type ProjectItem,
  type ResumePayload,
} from '@/lib/resume-utils'
import { calculateATSScore, extractATSKeywords, type ATSScoreResult } from '@/lib/ats-score'
import { LimitReachedModal } from '@/components/limit-reached-modal'

type ResumeHistoryRecord = {
  id: string
  role: string
  ats_score: number | null
  updated_at: string
}

function updateArrayItem<T extends object>(array: T[], index: number, patch: Partial<T>): T[] {
  return array.map((item, itemIndex) => (itemIndex === index ? { ...item, ...patch } : item))
}

export function ResumeBuilderClient() {
  const [resume, setResume] = useState<ResumePayload>(createEmptyResume())
  const [targetRole, setTargetRole] = useState('')
  const [rawExperienceDescription, setRawExperienceDescription] = useState('')
  const [jobDescription, setJobDescription] = useState('')
  const [extractedKeywords, setExtractedKeywords] = useState<string[]>([])
  const [history, setHistory] = useState<ResumeHistoryRecord[]>([])
  const [activeResumeId, setActiveResumeId] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [isOptimizingExperience, setIsOptimizingExperience] = useState(false)
  const [isOptimizingSummary, setIsOptimizingSummary] = useState(false)
  const [isRewriting, setIsRewriting] = useState(false)

  const {
    isAuthenticated,
    usage,
    limits,
    checkOrPrompt,
    openLimitModal,
    refreshUsage,
    limitReachedFeature,
    closeLimitModal,
  } = useAccessControl()

  const skillsList = useMemo(() => splitSkills(resume.skills), [resume.skills])
  const resumeText = useMemo(() => {
    return [
      'summary',
      resume.summary,
      'skills',
      resume.skills,
      'experience',
      resume.experience.map((item) => `${item.title} ${item.company} ${item.bullets}`).join('\n'),
      'education',
      resume.education.map((item) => `${item.school} ${item.degree} ${item.field}`).join('\n'),
      'projects',
      resume.projects.map((item) => `${item.name} ${item.description}`).join('\n'),
      resumeToPlainText(resume),
    ].join('\n')
  }, [resume])
  const atsResult = useMemo(() => {
    if (!resumeText.trim() || !jobDescription.trim()) return null
    return calculateATSScore(resumeText, jobDescription)
  }, [resumeText, jobDescription])
  const scoreBarColor = useMemo(() => {
    const score = atsResult?.score ?? 0
    if (score < 50) return 'bg-red-500'
    if (score <= 75) return 'bg-yellow-500'
    return 'bg-green-500'
  }, [atsResult?.score])

  const setField = <K extends keyof ResumePayload>(key: K, value: ResumePayload[K]) => {
    setResume((prev) => ({ ...prev, [key]: value }))
  }

  const fetchResumeHistory = async () => {
    if (!isAuthenticated) return
    try {
      const response = await fetch('/api/resume/history')
      if (!response.ok) return
      const data = await response.json()
      setHistory(Array.isArray(data?.records) ? data.records : [])
    } catch (error) {
      console.error('Failed to load resume history:', error)
    }
  }

  useEffect(() => {
    void fetchResumeHistory()
  }, [isAuthenticated])

  useEffect(() => {
    setExtractedKeywords(extractATSKeywords(jobDescription).slice(0, 24))
  }, [jobDescription])

  useEffect(() => {
    if (!isAuthenticated || !resumeText.trim() || !jobDescription.trim() || !atsResult) return
    const timeout = setTimeout(() => {
      void fetch('/api/resume/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          atsScore: atsResult.score,
          missingKeywords: atsResult.missingKeywords,
        }),
      })
    }, 1200)

    return () => clearTimeout(timeout)
  }, [isAuthenticated, resumeText, jobDescription, atsResult])

  const persistResumeAuto = async (nextResume: ResumePayload, nextAts?: ATSScoreResult | null) => {
    if (!isAuthenticated) return
    try {
      const response = await fetch('/api/resume/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeResumeId,
          role: targetRole,
          jobDescription,
          resume: nextResume,
          atsScore: nextAts?.score ?? atsResult?.score ?? null,
          atsBreakdown: {
            keywordMatch: nextAts?.keywordMatch ?? atsResult?.keywordMatch ?? 0,
            sectionScore: nextAts?.sectionScore ?? atsResult?.sectionScore ?? 0,
            actionVerbScore: nextAts?.actionVerbScore ?? atsResult?.actionVerbScore ?? 0,
          },
        }),
      })
      if (!response.ok) return
      const data = await response.json()
      const nextId = data?.record?.id as string | undefined
      if (nextId) setActiveResumeId(nextId)
      await fetchResumeHistory()
    } catch (error) {
      console.error('Automatic resume save failed:', error)
    }
  }

  const optimizeExperienceWithAI = async (index = 0) => {
    const sourceText = rawExperienceDescription.trim() || resume.experience[index]?.bullets.trim() || ''
    if (!sourceText) return
    setIsOptimizingExperience(true)
    try {
      const response = await fetch('/api/resume/optimize-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: targetRole || resume.role,
          rawDescription: sourceText,
          jobDescription: jobDescription.trim() || undefined,
          section: 'experience',
        }),
      })
      if (!response.ok) return
      const data = (await response.json()) as { optimized_text?: string }
      const optimized = String(data?.optimized_text || '').trim() || sourceText
      setRawExperienceDescription(optimized)
      setField('experience', updateArrayItem(resume.experience, index, { bullets: optimized }))
    } catch (error) {
      console.error('Experience optimization error:', error)
      setRawExperienceDescription(sourceText)
      setField('experience', updateArrayItem(resume.experience, index, { bullets: sourceText }))
    } finally {
      setIsOptimizingExperience(false)
    }
  }

  const optimizeSummaryWithAI = async () => {
    const sourceText = resume.summary.trim()
    if (!sourceText) return
    setIsOptimizingSummary(true)
    try {
      const response = await fetch('/api/resume/optimize-description', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          role: targetRole || resume.role,
          rawDescription: sourceText,
          jobDescription: jobDescription.trim() || undefined,
          section: 'summary',
        }),
      })
      if (!response.ok) return
      const data = (await response.json()) as { optimized_text?: string }
      const optimized = String(data?.optimized_text || '').trim() || sourceText
      setField('summary', optimized)
    } catch (error) {
      console.error('Summary optimization error:', error)
      setField('summary', sourceText)
    } finally {
      setIsOptimizingSummary(false)
    }
  }

  const saveResume = async () => {
    if (!isAuthenticated) return
    setIsSaving(true)
    try {
      const response = await fetch('/api/resume/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeResumeId,
          role: targetRole,
          jobDescription,
          resume,
          atsScore: atsResult?.score ?? null,
          atsBreakdown: {
            keywordMatch: atsResult?.keywordMatch ?? 0,
            sectionScore: atsResult?.sectionScore ?? 0,
            actionVerbScore: atsResult?.actionVerbScore ?? 0,
          },
        }),
      })
      if (!response.ok) return
      const data = await response.json()
      const nextId = data?.record?.id as string | undefined
      if (nextId) setActiveResumeId(nextId)
      await fetchResumeHistory()
    } catch (error) {
      console.error('Resume save failed:', error)
    } finally {
      setIsSaving(false)
    }
  }

  const loadResumeRecord = async (id: string) => {
    try {
      const response = await fetch(`/api/resume/history?id=${encodeURIComponent(id)}`)
      if (!response.ok) return
      const data = await response.json()
      const record = data?.record
      if (!record) return
      setActiveResumeId(record.id)
      setTargetRole(record.role || '')
      setJobDescription(record.job_description || '')
      setResume((record.resume_data || createEmptyResume()) as ResumePayload)
      setRawExperienceDescription(String(record?.resume_data?.experience?.[0]?.bullets || ''))
    } catch (error) {
      console.error('Failed to load resume:', error)
    }
  }

  const rewriteText = async (
    mode: 'improve' | 'ats' | 'stronger',
    sourceText: string,
    apply: (value: string) => void,
  ) => {
    if (!sourceText.trim()) return
    setIsRewriting(true)
    try {
      const response = await fetch('/api/resume/rewrite-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          role: targetRole || resume.role,
          sourceText: `${sourceText}\n\n${jobDescription}`.trim(),
        }),
      })
      if (!response.ok) return
      const data = await response.json()
      if (data?.rewritten) apply(data.rewritten)
    } catch (error) {
      console.error('Rewrite failed:', error)
    } finally {
      setIsRewriting(false)
    }
  }

  const downloadWord = () => {
    const html = buildWordHtml(resume)
    const blob = new Blob([html], { type: 'application/msword' })
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${resume.fullName || 'resume'}.doc`
    link.click()
  }

  const downloadPdf = async () => {
    if (!isAuthenticated && !checkOrPrompt('resume_downloads')) return
    try {
      const guestId = !isAuthenticated ? getGuestIdClient() : ''
      const response = await fetch('/api/resume/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(guestId ? { 'x-guest-id': guestId } : {}),
        },
        body: JSON.stringify(resume),
      })
      if (response.status === 429) {
        openLimitModal('resume_downloads')
        return
      }
      if (!response.ok) return
      await refreshUsage(isAuthenticated)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${resume.fullName || 'resume'}.pdf`
      link.click()
    } catch (error) {
      console.error('PDF download failed:', error)
    }
  }

  const renderExperienceCard = (item: ExperienceItem, index: number) => (
    <div key={`experience-${index}`} className="rounded-lg border border-border p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <Input className="bg-input text-foreground" value={item.title} onChange={(event) => setField('experience', updateArrayItem(resume.experience, index, { title: event.target.value }))} placeholder="Title" />
        <Input className="bg-input text-foreground" value={item.company} onChange={(event) => setField('experience', updateArrayItem(resume.experience, index, { company: event.target.value }))} placeholder="Company" />
      </div>
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Input className="bg-input text-foreground" value={item.duration} onChange={(event) => setField('experience', updateArrayItem(resume.experience, index, { duration: event.target.value }))} placeholder="Duration" />
        <Input className="bg-input text-foreground" value={item.location} onChange={(event) => setField('experience', updateArrayItem(resume.experience, index, { location: event.target.value }))} placeholder="Location" />
      </div>
      <Textarea
        className="mt-3 bg-input text-foreground"
        rows={5}
        value={item.bullets}
        onChange={(event) => setField('experience', updateArrayItem(resume.experience, index, { bullets: event.target.value }))}
        placeholder="One bullet per line."
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" disabled={isRewriting} onClick={() => rewriteText('stronger', item.bullets, (value) => setField('experience', updateArrayItem(resume.experience, index, { bullets: value })))}>
          Rewrite Bullets
        </Button>
        {resume.experience.length > 1 ? (
          <Button variant="outline" size="sm" onClick={() => setField('experience', resume.experience.filter((_, itemIndex) => itemIndex !== index))}>
            Remove
          </Button>
        ) : null}
      </div>
    </div>
  )

  const renderProjectCard = (item: ProjectItem, index: number) => (
    <div key={`project-${index}`} className="rounded-lg border border-border p-4">
      <Input className="bg-input text-foreground" value={item.name} onChange={(event) => setField('projects', updateArrayItem(resume.projects, index, { name: event.target.value }))} placeholder="Project Name" />
      <Textarea className="mt-3 bg-input text-foreground" rows={4} value={item.description} onChange={(event) => setField('projects', updateArrayItem(resume.projects, index, { description: event.target.value }))} placeholder="Description with outcomes." />
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Input className="bg-input text-foreground" value={item.tech} onChange={(event) => setField('projects', updateArrayItem(resume.projects, index, { tech: event.target.value }))} placeholder="Tech Stack" />
        <Input className="bg-input text-foreground" value={item.link} onChange={(event) => setField('projects', updateArrayItem(resume.projects, index, { link: event.target.value }))} placeholder="Link" />
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="outline" size="sm" disabled={isRewriting} onClick={() => rewriteText('improve', item.description, (value) => setField('projects', updateArrayItem(resume.projects, index, { description: value })))}>
          Enhance Project
        </Button>
        {resume.projects.length > 1 ? (
          <Button variant="outline" size="sm" onClick={() => setField('projects', resume.projects.filter((_, itemIndex) => itemIndex !== index))}>
            Remove
          </Button>
        ) : null}
      </div>
    </div>
  )

  const renderEducationCard = (item: EducationItem, index: number) => (
    <div key={`education-${index}`} className="rounded-lg border border-border p-4">
      <Input className="bg-input text-foreground" value={item.school} onChange={(event) => setField('education', updateArrayItem(resume.education, index, { school: event.target.value }))} placeholder="School" />
      <div className="mt-3 grid gap-3 md:grid-cols-2">
        <Input className="bg-input text-foreground" value={item.degree} onChange={(event) => setField('education', updateArrayItem(resume.education, index, { degree: event.target.value }))} placeholder="Degree" />
        <Input className="bg-input text-foreground" value={item.field} onChange={(event) => setField('education', updateArrayItem(resume.education, index, { field: event.target.value }))} placeholder="Field" />
      </div>
      <div className="mt-3 flex gap-2">
        <Input className="bg-input text-foreground" value={item.year} onChange={(event) => setField('education', updateArrayItem(resume.education, index, { year: event.target.value }))} placeholder="Year" />
        {resume.education.length > 1 ? (
          <Button variant="outline" onClick={() => setField('education', resume.education.filter((_, itemIndex) => itemIndex !== index))}>Remove</Button>
        ) : null}
      </div>
    </div>
  )

  const renderCertificationCard = (item: CertificationItem, index: number) => (
    <div key={`cert-${index}`} className="rounded-lg border border-border p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <Input className="bg-input text-foreground" value={item.name} onChange={(event) => setField('certifications', updateArrayItem(resume.certifications, index, { name: event.target.value }))} placeholder="Certification" />
        <Input className="bg-input text-foreground" value={item.issuer} onChange={(event) => setField('certifications', updateArrayItem(resume.certifications, index, { issuer: event.target.value }))} placeholder="Issuer" />
      </div>
      <div className="mt-3 flex gap-2">
        <Input className="bg-input text-foreground" value={item.year} onChange={(event) => setField('certifications', updateArrayItem(resume.certifications, index, { year: event.target.value }))} placeholder="Year" />
        {resume.certifications.length > 1 ? (
          <Button variant="outline" onClick={() => setField('certifications', resume.certifications.filter((_, itemIndex) => itemIndex !== index))}>Remove</Button>
        ) : null}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0b15] to-[#0e0e1a] text-foreground">
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-xl font-bold text-foreground">Coach AI</Link>
          <Button variant="outline" asChild>
            <Link href="/">Back Home</Link>
          </Button>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {!isAuthenticated && (
          <Card className="mb-6 border-border bg-card p-4 text-foreground">
            <p className="text-sm font-medium">Guest usage this 5-hour window: {usage.resume_downloads}/{limits.resume_downloads} resume download.</p>
            <p className="text-xs text-muted-foreground">Sign up to save resumes, ATS history, and edits across sessions.</p>
          </Card>
        )}

        <div className="grid gap-6 lg:grid-cols-12">
          <main className="space-y-6 lg:col-span-8">
            <Card className="space-y-4 p-6">
              <h1 className="text-3xl font-bold">AI Resume Generator</h1>
              <p className="text-sm text-muted-foreground">Write your raw experience, then optimize experience and summary with AI.</p>

              <div className="grid gap-3 md:grid-cols-2">
                <Input className="bg-input text-foreground" value={targetRole} onChange={(event) => { setTargetRole(event.target.value); setField('role', event.target.value) }} placeholder="Target Role (e.g. Senior Backend Engineer)" />
                <Input className="bg-input text-foreground" value={resume.fullName} onChange={(event) => setField('fullName', event.target.value)} placeholder="Full Name" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Input className="bg-input text-foreground" value={resume.email} onChange={(event) => setField('email', event.target.value)} placeholder="Email" />
                <Input className="bg-input text-foreground" value={resume.phone} onChange={(event) => setField('phone', event.target.value)} placeholder="Phone" />
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <Input className="bg-input text-foreground" value={resume.location} onChange={(event) => setField('location', event.target.value)} placeholder="Location" />
                <Input className="bg-input text-foreground" value={resume.website} onChange={(event) => setField('website', event.target.value)} placeholder="LinkedIn or Portfolio URL" />
              </div>
              <Textarea
                className="bg-input text-foreground"
                rows={7}
                value={rawExperienceDescription}
                onChange={(event) => setRawExperienceDescription(event.target.value)}
                placeholder="Write your raw experience description (one or more lines)."
              />
              <Textarea
                className="bg-input text-foreground"
                rows={4}
                value={jobDescription}
                onChange={(event) => setJobDescription(event.target.value)}
                placeholder="Optional: paste job description for better role keyword alignment."
              />

              <div className="flex flex-wrap gap-2">
                {isAuthenticated ? (
                  <Button variant="outline" onClick={saveResume} disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Resume'}
                  </Button>
                ) : null}
              </div>
            </Card>

            <Card className="space-y-4 p-6">
              <h2 className="text-xl font-semibold">Summary</h2>
              <Textarea className="bg-input text-foreground" rows={5} value={resume.summary} onChange={(event) => setField('summary', event.target.value)} placeholder="Professional summary." />
              <Button variant="outline" size="sm" disabled={isOptimizingSummary || !resume.summary.trim()} onClick={() => void optimizeSummaryWithAI()}>
                {isOptimizingSummary ? 'Optimizing Summary...' : 'Optimize Summary with AI'}
              </Button>
            </Card>

            <Card className="space-y-4 p-6">
              <h2 className="text-xl font-semibold">Skills</h2>
              <Textarea className="bg-input text-foreground" rows={4} value={resume.skills} onChange={(event) => setField('skills', event.target.value)} placeholder="Skill1, Skill2, Skill3" />
              <div className="flex flex-wrap gap-2">
                {skillsList.map((skill, index) => (
                  <Badge key={`${skill}-${index}`} className="bg-secondary text-foreground">{skill}</Badge>
                ))}
              </div>
            </Card>

            <Card className="space-y-4 p-6">
              <h2 className="text-xl font-semibold">Experience</h2>
              <Button
                variant="outline"
                size="sm"
                disabled={isOptimizingExperience || (!rawExperienceDescription.trim() && !resume.experience[0]?.bullets.trim())}
                onClick={() => void optimizeExperienceWithAI(0)}
              >
                {isOptimizingExperience ? 'Optimizing Description...' : 'Optimize Description with AI'}
              </Button>
              {resume.experience.map(renderExperienceCard)}
              <Button variant="outline" onClick={() => setField('experience', [...resume.experience, { company: '', title: '', duration: '', location: '', bullets: '' }])}>Add Experience</Button>
            </Card>

            <Card className="space-y-4 p-6">
              <h2 className="text-xl font-semibold">Projects</h2>
              {resume.projects.map(renderProjectCard)}
              <Button variant="outline" onClick={() => setField('projects', [...resume.projects, { name: '', description: '', tech: '', link: '' }])}>Add Project</Button>
            </Card>

            <Card className="space-y-4 p-6">
              <h2 className="text-xl font-semibold">Education</h2>
              {resume.education.map(renderEducationCard)}
              <Button variant="outline" onClick={() => setField('education', [...resume.education, { school: '', degree: '', field: '', year: '' }])}>Add Education</Button>
            </Card>

            <Card className="space-y-4 p-6">
              <h2 className="text-xl font-semibold">Certifications</h2>
              {resume.certifications.map(renderCertificationCard)}
              <Button variant="outline" onClick={() => setField('certifications', [...resume.certifications, { name: '', issuer: '', year: '' }])}>Add Certification</Button>
            </Card>

            <Card className="space-y-4 p-6">
              <h2 className="text-xl font-semibold">Export</h2>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={downloadWord}>
                  <FileDown className="mr-2 size-4" />
                  Export Word
                </Button>
                <Button onClick={downloadPdf}>
                  <FileDown className="mr-2 size-4" />
                  Export PDF (ATS)
                </Button>
              </div>
            </Card>
          </main>

          <aside className="space-y-6 lg:col-span-4">
            <Card className="space-y-4 p-6">
              <h2 className="text-lg font-semibold">ATS Score Checker</h2>
              <div className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Dynamic ATS Score</span>
                  <span className="text-xl font-bold">{atsResult?.score ?? 0}%</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-input">
                  <div className={`h-2 rounded-full transition-all duration-300 ${scoreBarColor}`} style={{ width: `${Math.max(0, Math.min(100, atsResult?.score ?? 0))}%` }} />
                </div>
                <div className="mt-3 space-y-1 text-xs text-muted-foreground">
                  <p>Keyword Match: {atsResult?.keywordMatch ?? 0}%</p>
                  <p>Section Completeness: {atsResult?.sectionScore ?? 0}%</p>
                  <p>Action Verb Strength: {atsResult?.actionVerbScore ?? 0}%</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium">Extracted Keywords</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {extractedKeywords.slice(0, 24).map((keyword, index) => (
                    <Badge key={`${keyword}-${index}`} className="bg-secondary text-foreground">{keyword}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium">Missing Keywords</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(atsResult?.missingKeywords || []).map((keyword, index) => (
                    <Badge key={`${keyword}-${index}`} className="bg-amber-200 text-amber-900">{keyword}</Badge>
                  ))}
                </div>
              </div>

            </Card>

            {isAuthenticated ? (
              <Card className="space-y-3 p-6">
                <h2 className="text-lg font-semibold">Saved Resumes</h2>
                {history.length ? (
                  history.map((record) => (
                    <button
                      type="button"
                      key={record.id}
                      onClick={() => void loadResumeRecord(record.id)}
                      className={`w-full rounded-lg border p-3 text-left transition-colors ${
                        activeResumeId === record.id ? 'border-primary bg-primary/10' : 'border-border bg-card hover:bg-secondary/40'
                      }`}
                    >
                      <p className="text-sm font-medium">{record.role || 'Untitled Role'}</p>
                      <p className="text-xs text-muted-foreground">ATS: {record.ats_score ?? 0}%</p>
                      <p className="text-xs text-muted-foreground">{new Date(record.updated_at).toLocaleString()}</p>
                    </button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">No saved resumes yet.</p>
                )}
              </Card>
            ) : null}

            <Card className="border-slate-300 bg-white p-6 text-slate-800 shadow-xl">
              <h2 className="mb-4 text-lg font-semibold text-slate-900">Live ATS Preview</h2>
              <div className="rounded-md border border-slate-200 bg-white p-6 shadow-sm">
                <header className="border-b border-slate-200 pb-4">
                  <h1 className="text-2xl font-bold text-slate-900">{resume.fullName || 'Your Name'}</h1>
                  <p className="mt-1 text-xs text-slate-600">{[resume.email, resume.phone, resume.location, resume.website].filter(Boolean).join(' | ') || 'email | phone | location'}</p>
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-700">{targetRole || resume.role || 'Target Role'}</p>
                </header>

                {resume.summary ? (
                  <section className="mt-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">Summary</h3>
                    <p className="mt-1 whitespace-pre-wrap text-[13px] text-slate-700">{resume.summary}</p>
                  </section>
                ) : null}

                {resume.experience.some((item) => item.title || item.company || item.bullets) ? (
                  <section className="mt-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">Experience</h3>
                    <div className="mt-2 space-y-3">
                      {resume.experience.filter((item) => item.title || item.company || item.bullets).map((item, index) => (
                        <div key={`${item.company}-${index}`}>
                          <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                          <p className="text-xs text-slate-600">{[item.company, item.duration, item.location].filter(Boolean).join(' | ')}</p>
                          <ul className="mt-1 list-disc space-y-1 pl-4 text-[13px] text-slate-700">
                            {splitLines(item.bullets).map((bullet, bulletIndex) => (
                              <li key={`${bullet}-${bulletIndex}`}>{bullet}</li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                {skillsList.length ? (
                  <section className="mt-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">Skills</h3>
                    <p className="mt-1 text-[13px] text-slate-700">{skillsList.join(', ')}</p>
                  </section>
                ) : null}

                {resume.projects.some((item) => item.name) ? (
                  <section className="mt-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">Projects</h3>
                    <div className="mt-2 space-y-2">
                      {resume.projects.filter((item) => item.name).map((item, index) => (
                        <div key={`${item.name}-${index}`}>
                          <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                          <p className="text-[13px] text-slate-700">{item.description}</p>
                        </div>
                      ))}
                    </div>
                  </section>
                ) : null}

                {resume.education.some((item) => item.school || item.degree) ? (
                  <section className="mt-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">Education</h3>
                    {resume.education.filter((item) => item.school || item.degree).map((item, index) => (
                      <p key={`${item.school}-${index}`} className="text-[13px] text-slate-700">
                        {[item.degree, item.field, item.school, item.year].filter(Boolean).join(' | ')}
                      </p>
                    ))}
                  </section>
                ) : null}

                {resume.certifications.some((item) => item.name) ? (
                  <section className="mt-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">Certifications</h3>
                    {resume.certifications.filter((item) => item.name).map((item, index) => (
                      <p key={`${item.name}-${index}`} className="text-[13px] text-slate-700">
                        {[item.name, item.issuer, item.year].filter(Boolean).join(' | ')}
                      </p>
                    ))}
                  </section>
                ) : null}
              </div>
            </Card>
          </aside>
        </div>
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

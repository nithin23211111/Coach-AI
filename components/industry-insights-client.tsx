'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Input } from '@/components/ui/input'
import { Toaster } from '@/components/ui/sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { RoleCombobox, type RoleOption } from '@/components/role-combobox'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from 'recharts'
import { useAccessControl } from '@/hooks/use-access-control'
import { INSIGHTS_DATA_BY_INDUSTRY, type DemandLevel } from '@/data/insights-data'
import { toast } from 'sonner'
import { buildIndustryOutlook, calculateIndustryConfidenceScore, formatINR } from '@/lib/industry-insights-utils'

type SkillItem = { name: string; growth: number }
type OverviewItem = { label: string; value: string }

type DashboardData = {
  title: string
  summary: string
  growthRate: number
  hiringTrend: number
  demandLevel: DemandLevel
  avgSalary: number
  yearlyMarketData: Array<{ year: number; salary: number; demand: number }>
  topSkills: SkillItem[]
  sectors: string[]
}

type OverviewData = {
  topGrowingIndustries: OverviewItem[]
  highestSalaryIndustries: OverviewItem[]
  strongestDemandSectors: string[]
}

type OverallSnapshot = {
  growthTrend: string
  demandOutlook: string
  salaryRange: string
  hiringOutlook: string
}

const CACHE_PREFIX = 'coach_ai_industry_insights_v3'
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

const INDUSTRIES = [
  { value: 'technology', label: 'Technology' },
  { value: 'finance', label: 'Finance' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'government', label: 'Government' },
  { value: 'design', label: 'Design' },
  { value: 'ai_data', label: 'AI & Data' },
]

const INDUSTRY_ROLE_OPTIONS: Record<string, string[]> = {
  technology: ['Software Engineer', 'DevOps Engineer', 'Data Scientist'],
  finance: ['Investment Analyst', 'Risk Manager', 'FinTech Developer'],
  healthcare: ['Healthcare Analyst', 'Clinical Operations Manager', 'HealthTech Specialist'],
  education: ['Instructional Designer', 'Academic Program Manager', 'EdTech Product Specialist'],
  ecommerce: ['Marketplace Analyst', 'Growth Manager', 'E-commerce Operations Lead'],
  manufacturing: ['Process Engineer', 'Supply Chain Analyst', 'Plant Operations Manager'],
  consulting: ['Business Consultant', 'Strategy Analyst', 'Transformation Lead'],
  government: ['Policy Analyst', 'Public Program Manager', 'Digital Governance Specialist'],
  design: ['Product Designer', 'UX Researcher', 'Design System Specialist'],
  ai_data: ['Machine Learning Engineer', 'Data Engineer', 'AI Product Analyst'],
}

const ROLE_SKILL_OVERLAY: Record<string, string[]> = {
  'software engineer': ['System Design', 'TypeScript', 'Cloud Engineering'],
  'devops engineer': ['Kubernetes', 'CI/CD', 'Cloud Security'],
  'data scientist': ['Machine Learning', 'Experimentation', 'Feature Engineering'],
  'investment analyst': ['Financial Modeling', 'Risk Analysis', 'Market Research'],
  'risk manager': ['Risk Governance', 'Regulatory Compliance', 'Scenario Analysis'],
  'fintech developer': ['Payments Systems', 'Fraud Detection', 'API Security'],
  'healthcare analyst': ['Health Informatics', 'Patient Data Systems', 'Compliance'],
  'clinical operations manager': ['Clinical Workflows', 'Process Optimization', 'Quality Systems'],
  'healthtech specialist': ['Digital Health Platforms', 'Healthcare Analytics', 'Interoperability'],
}

function hashString(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function getTrendDirection(value: number) {
  if (value >= 0) return { symbol: '^', className: 'text-emerald-400' }
  return { symbol: 'v', className: 'text-red-400' }
}

function generateMarketOutlookSummary(data: DashboardData) {
  const expansionNarrative =
    data.growthRate > 20
      ? `${data.title} is in a strong expansion cycle with sustained hiring and compensation momentum.`
      : data.growthRate >= 14
        ? `${data.title} is showing healthy expansion with consistent year-over-year market movement.`
        : `${data.title} is growing at a moderate pace with selective but stable opportunities.`

  const demandNarrative =
    data.demandLevel === 'Very High'
      ? 'Demand remains very high as organizations compete for execution-ready talent.'
      : data.demandLevel === 'High'
        ? 'Demand remains strong with continued hiring in growth and transformation programs.'
        : 'Demand is moderate with focused hiring in specialized functions.'

  const topSkill = data.topSkills[0]
  const skillNarrative = topSkill
    ? `${topSkill.name} is a leading required skill at +${topSkill.growth.toLocaleString('en-IN')}% demand growth.`
    : ''

  return `${expansionNarrative} ${demandNarrative} ${skillNarrative}`.trim()
}

function createOverviewData(): OverviewData {
  const all = Object.values(INSIGHTS_DATA_BY_INDUSTRY)

  const topGrowingIndustries = [...all]
    .sort((a, b) => b.growthRate - a.growthRate)
    .slice(0, 3)
    .map((item) => ({ label: item.label, value: `+${Math.round(item.growthRate * 100)}%` }))

  const highestSalaryIndustries = [...all]
    .sort((a, b) => b.avgSalary - a.avgSalary)
    .slice(0, 3)
    .map((item) => ({ label: item.label, value: formatINR(item.avgSalary) }))

  const sectors = new Map<string, number>()
  for (const industry of all) {
    const demandWeight = industry.demandLevel === 'Very High' ? 3 : industry.demandLevel === 'High' ? 2 : 1
    for (const sector of industry.sectors) {
      sectors.set(sector, (sectors.get(sector) || 0) + demandWeight)
    }
  }
  const strongestDemandSectors = Array.from(sectors.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([sector]) => sector)

  return { topGrowingIndustries, highestSalaryIndustries, strongestDemandSectors }
}

function createOverallSnapshot(): OverallSnapshot {
  const all = Object.values(INSIGHTS_DATA_BY_INDUSTRY)
  const growthAverage = all.reduce((sum, item) => sum + item.growthRate, 0) / Math.max(1, all.length)
  const demandIndexAverage = all.reduce((sum, item) => {
    const demandWeight = item.demandLevel === 'Very High' ? 3 : item.demandLevel === 'High' ? 2 : 1
    return sum + demandWeight
  }, 0) / Math.max(1, all.length)
  const salaryValues = all.map((item) => item.avgSalary)
  const minSalary = Math.min(...salaryValues)
  const maxSalary = Math.max(...salaryValues)
  const hiringAverage = all.reduce((sum, item) => sum + item.hiringTrend[0].demand, 0) / Math.max(1, all.length)

  const growthTrend = growthAverage >= 18 ? 'Strong upward momentum across core sectors.' : 'Steady year-over-year expansion across major industries.'
  const demandOutlook = demandIndexAverage >= 2.4 ? 'Overall demand remains high for execution-ready talent.' : 'Demand is stable with selective growth pockets.'
  const salaryRange = `${formatINR(minSalary)} - ${formatINR(maxSalary)}`
  const hiringOutlook = hiringAverage >= 12 ? 'Hiring outlook is positive with sustained opening growth.' : 'Hiring outlook is moderate with role-focused expansion.'

  return { growthTrend, demandOutlook, salaryRange, hiringOutlook }
}

function createIndustryDashboardData(industryKey: string, selectedRole: string): DashboardData {
  const outlook = buildIndustryOutlook(industryKey as keyof typeof INSIGHTS_DATA_BY_INDUSTRY)
  const preset = INSIGHTS_DATA_BY_INDUSTRY[industryKey] ?? INSIGHTS_DATA_BY_INDUSTRY.technology

  const role = selectedRole.trim()
  const roleSeed = role ? hashString(`${industryKey}:${role.toLowerCase()}`) : 0
  const roleGrowthDelta = role ? ((roleSeed % 5) - 2) : 0
  const roleSalaryDelta = role ? ((roleSeed % 140000) - 70000) : 0
  const roleHiringDelta = role ? ((roleSeed % 7) - 3) : 0

  const adjustedGrowthRate = Math.max(4, Number((outlook.growthRate + roleGrowthDelta).toFixed(1)))
  const adjustedSalary = Math.max(450000, outlook.avgSalary + roleSalaryDelta)
  const adjustedHiring = Math.max(4, outlook.hiringTrend + roleHiringDelta)
  const demandLevel: DemandLevel =
    adjustedGrowthRate >= 24 ? 'Very High' : adjustedGrowthRate >= 15 ? 'High' : 'Moderate'

  const overlaySkills = ROLE_SKILL_OVERLAY[role.toLowerCase()] || []
  const topSkills = Array.from(
    new Set([
      ...overlaySkills,
      ...preset.skillsInDemand.map((item) => item.name),
    ]),
  ).slice(0, 6).map((name, index) => ({
    name,
    growth: Math.max(6, preset.skillsInDemand[index]?.pct ?? 10),
  }))

  const scale = adjustedSalary / Math.max(1, preset.avgSalary)
  const yearlyMarketData = preset.salaryTrend.map((point, index) => {
    const baseDemand = preset.hiringTrend[index]?.demand ?? adjustedHiring
    return {
      year: point.year,
      salary: Math.round(point.salary * scale),
      demand: Math.max(3, baseDemand + roleHiringDelta),
    }
  })

  return {
    title: role ? `${preset.label} - ${role}` : preset.label,
    summary: role
      ? `${preset.summary} Role lens applied for ${role}, focusing required skills and compensation direction for this track.`
      : preset.summary,
    growthRate: adjustedGrowthRate,
    hiringTrend: adjustedHiring,
    demandLevel,
    avgSalary: adjustedSalary,
    yearlyMarketData,
    topSkills,
    sectors: preset.sectors,
  }
}

export default function IndustryInsightsClient() {
  const { loading, isAuthenticated } = useAccessControl()
  const [selectedIndustry, setSelectedIndustry] = useState('')
  const [selectedRoleOption, setSelectedRoleOption] = useState('all')
  const [customRole, setCustomRole] = useState('')
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [overviewData, setOverviewData] = useState<OverviewData | null>(null)
  const [overallSnapshot, setOverallSnapshot] = useState<OverallSnapshot | null>(null)
  const [marketOutlookSummary, setMarketOutlookSummary] = useState('')
  const [confidenceScore, setConfidenceScore] = useState(0)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [nextUpdate, setNextUpdate] = useState<Date | null>(null)
  const [isSavingSnapshot, setIsSavingSnapshot] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)

  useEffect(() => {
    setOverviewData(createOverviewData())
    setOverallSnapshot(createOverallSnapshot())
  }, [])

  useEffect(() => {
    if (!lastUpdated) {
      setNextUpdate(null)
      return
    }
    setNextUpdate(new Date(lastUpdated.getTime() + WEEK_MS))
  }, [lastUpdated])

  useEffect(() => {
    setSelectedRoleOption('all')
    setCustomRole('')
  }, [selectedIndustry])

  useEffect(() => {
    if (!selectedIndustry) {
      setDashboardData(null)
      setMarketOutlookSummary('')
      setConfidenceScore(0)
      setLastUpdated(null)
      return
    }

    setIsRefreshing(true)
    const resolvedRole = selectedRoleOption === '__other__' ? customRole.trim() : selectedRoleOption
    const roleFilter = resolvedRole === 'all' ? '' : resolvedRole
    const cacheKey = `${CACHE_PREFIX}:${selectedIndustry}:${roleFilter || 'all'}`
    const now = new Date()

    try {
      const cached = localStorage.getItem(cacheKey)
      if (cached) {
        const parsed = JSON.parse(cached) as { data: DashboardData; lastUpdated: string }
        const cachedLastUpdated = new Date(parsed.lastUpdated)
        if (cachedLastUpdated.getTime() + WEEK_MS > now.getTime()) {
          setDashboardData(parsed.data)
          setLastUpdated(cachedLastUpdated)
          setConfidenceScore(calculateIndustryConfidenceScore(parsed.data))
          setMarketOutlookSummary(generateMarketOutlookSummary(parsed.data))
          setIsRefreshing(false)
          return
        }
      }
    } catch {
      // fall through to regeneration
    }

    const generatedData = createIndustryDashboardData(selectedIndustry, roleFilter)
    setDashboardData(generatedData)
    setLastUpdated(now)
    setConfidenceScore(calculateIndustryConfidenceScore(generatedData))
    setMarketOutlookSummary(generateMarketOutlookSummary(generatedData))

    try {
      localStorage.setItem(
        cacheKey,
        JSON.stringify({
          data: generatedData,
          lastUpdated: now.toISOString(),
        }),
      )
    } catch {
      // ignore localStorage failures
    }

    setIsRefreshing(false)
  }, [customRole, selectedIndustry, selectedRoleOption])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  const growthDirection = getTrendDirection(dashboardData?.growthRate ?? 0)
  const hiringDirection = getTrendDirection(dashboardData?.hiringTrend ?? 0)
  const topGrowingIndustries = (overviewData?.topGrowingIndustries?.length ?? 0) > 0
    ? overviewData?.topGrowingIndustries ?? []
    : [
      { label: 'Technology', value: '+21%' },
      { label: 'AI & Data', value: '+19%' },
      { label: 'Healthcare', value: '+16%' },
    ]
  const highestSalaryIndustries = (overviewData?.highestSalaryIndustries?.length ?? 0) > 0
    ? overviewData?.highestSalaryIndustries ?? []
    : [
      { label: 'Finance', value: formatINR(1850000) },
      { label: 'Technology', value: formatINR(1720000) },
      { label: 'Consulting', value: formatINR(1610000) },
    ]
  const strongestDemandSectors = (overviewData?.strongestDemandSectors?.length ?? 0) > 0
    ? overviewData?.strongestDemandSectors ?? []
    : ['Cloud Platforms', 'Data Engineering', 'Cybersecurity', 'Product Analytics', 'Automation', 'Digital Health']
  const displayedSkills = (dashboardData?.topSkills?.length ?? 0) > 0
    ? dashboardData?.topSkills ?? []
    : [
      { name: 'AI Literacy', growth: 18 },
      { name: 'System Design', growth: 16 },
      { name: 'Data Analysis', growth: 14 },
    ]
  const roleOptions: RoleOption[] = [
    { value: 'all', label: 'All Roles' },
    ...((INDUSTRY_ROLE_OPTIONS[selectedIndustry] || []).map((role) => ({ value: role, label: role }))),
    { value: '__other__', label: 'Other (Type your role)' },
  ]

  const saveInsightSnapshot = async () => {
    if (!dashboardData || isSavingSnapshot) return
    if (!isAuthenticated) {
      toast.info('Sign in to save insight snapshots to your dashboard.')
      return
    }
    setIsSavingSnapshot(true)
    try {
      const response = await fetch('/api/insights/snapshot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          industryName: dashboardData.title,
          growthRate: dashboardData.growthRate,
          avgSalary: dashboardData.avgSalary,
          demandLevel: dashboardData.demandLevel,
          hiringTrend: dashboardData.hiringTrend,
          confidenceScore,
        }),
      })

      if (!response.ok) {
        toast.error('Failed to save insight snapshot')
        return
      }
      toast.success('Insight snapshot saved')
    } catch {
      toast.error('Failed to save insight snapshot')
    } finally {
      setIsSavingSnapshot(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0b15] to-[#0e0e1a]">
      <Toaster position="top-right" />
      <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-xl font-bold text-foreground">Coach AI</span>
          </Link>
          <div className="flex gap-3">
            {isAuthenticated ? (
              <Button variant="ghost" asChild>
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button asChild>
                  <Link href="/auth/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </nav>

      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <div className="rounded-2xl border border-white/10 bg-card/70 p-6 backdrop-blur-sm">
              <div className="grid gap-4 lg:grid-cols-3">
                <div className="space-y-3 lg:col-span-2">
                  <h1 className="text-3xl font-bold text-foreground">Industry Insights</h1>
                  <p className="text-sm text-muted-foreground">
                    Select an industry for detailed outlook and optionally narrow by role.
                  </p>
                  <div className="rounded-xl border border-white/10 bg-background/30 p-4 text-sm text-muted-foreground">
                    <p className="font-semibold text-foreground">What are Industry Insights?</p>
                    <p className="mt-1">Industry Insights helps you compare hiring momentum, salary direction, and demand signals across sectors.</p>
                    <p>Use it to prioritize target roles and plan learning paths with market-backed context.</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="border border-primary/40 bg-primary/20 text-primary">
                      Next Update {nextUpdate?.toLocaleDateString('en-IN') ?? '-'}
                    </Badge>
                  </div>
                </div>
                <div className="space-y-2 rounded-xl border border-white/10 bg-background/40 p-4 text-sm">
                  <p className="text-muted-foreground">
                    Last Updated:{' '}
                    <span className="text-foreground">{lastUpdated?.toLocaleDateString('en-IN') ?? '-'}</span>
                  </p>
                  <p className="text-muted-foreground">
                    Next Update:{' '}
                    <span className="text-foreground">{nextUpdate?.toLocaleDateString('en-IN') ?? '-'}</span>
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-8 transition-all duration-300">
              {overallSnapshot && (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <Card className="p-5">
                    <p className="text-xs font-semibold text-muted-foreground">Growth Trends</p>
                    <p className="mt-2 text-sm text-foreground">{overallSnapshot.growthTrend}</p>
                  </Card>
                  <Card className="p-5">
                    <p className="text-xs font-semibold text-muted-foreground">Demand Outlook</p>
                    <p className="mt-2 text-sm text-foreground">{overallSnapshot.demandOutlook}</p>
                  </Card>
                  <Card className="p-5">
                    <p className="text-xs font-semibold text-muted-foreground">Salary Range</p>
                    <p className="mt-2 text-sm text-foreground">{overallSnapshot.salaryRange}</p>
                  </Card>
                  <Card className="p-5">
                    <p className="text-xs font-semibold text-muted-foreground">Hiring Outlook</p>
                    <p className="mt-2 text-sm text-foreground">{overallSnapshot.hiringOutlook}</p>
                  </Card>
                </div>
              )}
              <div className="grid gap-4 md:grid-cols-2">
                <Card className="p-6">
                  <label className="mb-3 block text-sm font-semibold text-foreground">Select Industry</label>
                  <Select value={selectedIndustry} onValueChange={setSelectedIndustry}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose an industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((industry) => (
                        <SelectItem key={industry.value} value={industry.value}>
                          {industry.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Card>

                <Card className="p-6">
                  <label className="mb-3 block text-sm font-semibold text-foreground">Filter by Role</label>
                  <RoleCombobox
                    options={roleOptions}
                    value={selectedRoleOption}
                    onChange={setSelectedRoleOption}
                    placeholder={selectedIndustry ? 'All roles in this industry' : 'Select an industry first'}
                    className="z-20"
                  />
                  {selectedRoleOption === '__other__' && (
                    <Input
                      value={customRole}
                      onChange={(event) => setCustomRole(event.target.value)}
                      placeholder="Type your career role"
                      className="mt-3 bg-input text-foreground"
                    />
                  )}
                </Card>
              </div>

              {!selectedIndustry ? (
                <div className="space-y-6">
                  <Card className="p-6">
                    <h2 className="mb-4 text-xl font-bold text-foreground">Overall Market Overview</h2>
                    <p className="text-sm text-muted-foreground">
                      Snapshot across industries to help prioritize growth, salary potential, and demand.
                    </p>
                  </Card>

                  <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="p-6">
                      <h3 className="mb-4 text-lg font-semibold text-foreground">Top Growing Industries</h3>
                      <div className="space-y-3">
                        {topGrowingIndustries.map((item) => (
                          <div key={item.label} className="flex items-center justify-between rounded-lg border border-white/10 bg-background/30 p-3">
                            <span className="text-sm text-foreground">{item.label}</span>
                            <span className="text-sm font-semibold text-primary">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </Card>

                    <Card className="p-6">
                      <h3 className="mb-4 text-lg font-semibold text-foreground">Highest Salary Industries</h3>
                      <div className="space-y-3">
                        {highestSalaryIndustries.map((item) => (
                          <div key={item.label} className="flex items-center justify-between rounded-lg border border-white/10 bg-background/30 p-3">
                            <span className="text-sm text-foreground">{item.label}</span>
                            <span className="text-sm font-semibold text-cyan-300">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    </Card>

                    <Card className="p-6">
                      <h3 className="mb-4 text-lg font-semibold text-foreground">Strongest Demand Sectors</h3>
                      <div className="grid gap-2">
                        {strongestDemandSectors.map((sector) => (
                          <div key={sector} className="rounded-lg border border-white/10 bg-background/30 p-3 text-sm text-foreground">
                            {sector}
                          </div>
                        ))}
                      </div>
                    </Card>
                  </div>
                </div>
              ) : (
                <>
                  <Card className="border border-white/10 bg-card/70 p-6 backdrop-blur-sm">
                    <div className="grid gap-4 lg:grid-cols-3">
                      <div className="space-y-3 lg:col-span-2">
                        <h2 className="text-2xl font-bold text-foreground">{dashboardData?.title || 'Industry'} Insights</h2>
                        <p className="text-sm text-muted-foreground">{dashboardData?.summary || ''}</p>
                        <div>
                          <Button type="button" variant="outline" onClick={() => void saveInsightSnapshot()} disabled={isSavingSnapshot || !dashboardData}>
                            {isSavingSnapshot ? 'Saving Snapshot...' : 'Save Insight Snapshot'}
                          </Button>
                        </div>
                      </div>
                      <div className="space-y-2 rounded-xl border border-white/10 bg-background/40 p-4 text-sm">
                        <p className="text-muted-foreground">Confidence Score</p>
                        <Badge className="border border-primary/40 bg-primary/20 text-primary">{confidenceScore}%</Badge>
                        <Progress value={confidenceScore} className="h-2 bg-white/10 [&>div]:bg-gradient-to-r [&>div]:from-[#a855f7] [&>div]:to-[#ec4899]" />
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="mb-3 text-lg font-semibold text-foreground">Future Outlook</h3>
                    {isRefreshing ? <Skeleton className="h-16 w-full bg-white/10" /> : <p className="text-sm leading-7 text-muted-foreground">{marketOutlookSummary}</p>}
                  </Card>

                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                    <Card className="border border-primary/40 bg-gradient-to-b from-primary/10 to-transparent p-6">
                      <p className="mb-2 text-sm font-semibold text-muted-foreground">Growth Rate</p>
                      {isRefreshing ? <Skeleton className="mb-2 h-8 w-24 bg-white/10" /> : (
                        <p className="mb-2 flex items-center gap-2 text-2xl font-bold text-primary">
                          <span className={growthDirection.className}>{growthDirection.symbol}</span>
                          +{Number(dashboardData?.growthRate || 0).toLocaleString('en-IN')}%
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">YoY industry-market growth</p>
                    </Card>

                    <Card className="border border-accent/40 bg-gradient-to-b from-accent/10 to-transparent p-6">
                      <p className="mb-2 text-sm font-semibold text-muted-foreground">Demand Level</p>
                      {isRefreshing ? <Skeleton className="mb-2 h-8 w-28 bg-white/10" /> : <p className="mb-2 text-2xl font-bold text-foreground">{dashboardData?.demandLevel || '-'}</p>}
                      <p className="text-xs text-muted-foreground">Current demand strength</p>
                    </Card>

                    <Card className="border border-cyan-400/40 bg-gradient-to-b from-cyan-400/10 to-transparent p-6">
                      <p className="mb-2 text-sm font-semibold text-muted-foreground">Average Salary</p>
                      {isRefreshing ? <Skeleton className="mb-2 h-8 w-36 bg-white/10" /> : <p className="mb-2 text-2xl font-bold text-foreground">{formatINR(Number(dashboardData?.avgSalary || 0))}</p>}
                      <p className="text-xs text-muted-foreground">Estimated annual compensation</p>
                    </Card>

                    <Card className="border border-emerald-400/40 bg-gradient-to-b from-emerald-400/10 to-transparent p-6">
                      <p className="mb-2 text-sm font-semibold text-muted-foreground">Hiring Trend</p>
                      {isRefreshing ? <Skeleton className="mb-2 h-8 w-24 bg-white/10" /> : (
                        <p className="mb-2 flex items-center gap-2 text-2xl font-bold text-emerald-300">
                          <span className={hiringDirection.className}>{hiringDirection.symbol}</span>
                          +{Math.round(Number(dashboardData?.hiringTrend || 0)).toLocaleString('en-IN')}%
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">Openings growth trajectory</p>
                    </Card>
                  </div>

                  <div className="grid gap-6 xl:grid-cols-2">
                    <Card className="p-6">
                      <h3 className="mb-6 text-xl font-bold text-foreground">Salary Trend (2019-2024)</h3>
                      {isRefreshing ? (
                        <Skeleton className="h-[320px] w-full bg-white/10" />
                      ) : (
                        <ResponsiveContainer width="100%" height={320}>
                          <LineChart data={dashboardData?.yearlyMarketData || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="year" />
                            <YAxis />
                            <Tooltip formatter={(value: number) => formatINR(Number(value))} />
                            <Legend />
                            <Line type="monotone" dataKey="salary" stroke="#a855f7" strokeWidth={2} dot={{ fill: '#ec4899' }} name="Average Salary (INR)" />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </Card>

                    <Card className="p-6">
                      <h3 className="mb-6 text-xl font-bold text-foreground">Hiring Trend (2019-2024)</h3>
                      {isRefreshing ? (
                        <Skeleton className="h-[320px] w-full bg-white/10" />
                      ) : (
                        <ResponsiveContainer width="100%" height={320}>
                          <BarChart data={dashboardData?.yearlyMarketData || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                            <XAxis dataKey="year" />
                            <YAxis />
                            <Tooltip formatter={(value: number) => `${Number(value).toLocaleString('en-IN')}%`} />
                            <Legend />
                            <Bar dataKey="demand" fill="#ec4899" radius={[8, 8, 0, 0]} name="Hiring Growth %" />
                          </BarChart>
                        </ResponsiveContainer>
                      )}
                    </Card>
                  </div>

                  <Card className="p-6">
                    <h3 className="mb-6 text-xl font-bold text-foreground">Required Skills</h3>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {displayedSkills.map((skill) => (
                        <div key={skill.name} className="rounded-lg border border-white/10 bg-background/30 p-4">
                          <p className="font-semibold text-foreground">{skill.name}</p>
                          <p className="text-sm text-primary">+{skill.growth.toLocaleString('en-IN')}% growth</p>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="p-6">
                    <p className="text-xs text-muted-foreground">
                      Dashboard refreshes every 7 days. Next update scheduled for{' '}
                      <span className="text-foreground">{nextUpdate?.toLocaleDateString('en-IN') ?? '-'}</span>.
                    </p>
                  </Card>
                </>
              )}
            </div>
          </div>
        </div>

      </section>
    </div>
  )
}


import { INSIGHTS_DATA_BY_INDUSTRY, type DemandLevel } from '@/data/insights-data'

type IndustryKey = keyof typeof INSIGHTS_DATA_BY_INDUSTRY

export type IndustryOutlook = {
  title: string
  summary: string
  growthRate: number
  hiringTrend: number
  demandLevel: DemandLevel
  avgSalary: number
  yearlyMarketData: Array<{ year: number; salary: number; demand: number }>
}

function hashString(value: string) {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

function offset(value: number, variance: number, seed: number) {
  const shift = (seed % (variance * 2 + 1)) - variance
  return value + shift
}

export function buildIndustryOutlook(industryKey: IndustryKey): IndustryOutlook {
  const preset = INSIGHTS_DATA_BY_INDUSTRY[industryKey] ?? INSIGHTS_DATA_BY_INDUSTRY.technology
  const title = preset.label
  const seed = hashString(`${industryKey}:industry`)

  const growthRate = Math.max(6, Math.round((preset.growthRate * 100 + offset(0, 4, seed)) * 10) / 10)
  const baseHiring = preset.hiringTrend[preset.hiringTrend.length - 1]?.demand ?? 10
  const hiringTrend = Math.max(5, baseHiring + offset(0, 4, seed + 13))
  const avgSalary = Math.max(60000, preset.avgSalary + offset(0, 15000, seed + 29))
  const demandLevel: DemandLevel =
    growthRate >= 24 ? 'Very High' : growthRate >= 16 ? 'High' : 'Moderate'

  const salaryScale = avgSalary / preset.avgSalary
  const hiringShift = hiringTrend - baseHiring
  const yearlyMarketData = preset.salaryTrend.map((point, index) => {
    const baseDemand = preset.hiringTrend[index]?.demand ?? baseHiring
    return {
      year: point.year,
      salary: Math.round(point.salary * salaryScale),
      demand: Math.max(3, baseDemand + hiringShift),
    }
  })

  return {
    title,
    summary: preset.summary,
    growthRate,
    hiringTrend,
    demandLevel,
    avgSalary,
    yearlyMarketData,
  }
}

export function resolveIndustryKeyFromRole(role: string): IndustryKey {
  const normalized = role.toLowerCase().trim()
  if (/(health|medical|clinical|pharma)/.test(normalized)) return 'healthcare'
  if (/(finance|bank|fintech|risk|audit)/.test(normalized)) return 'finance'
  if (/(education|teacher|learning|edtech)/.test(normalized)) return 'education'
  if (/(e-?commerce|retail|marketplace)/.test(normalized)) return 'ecommerce'
  if (/(manufactur|factory|supply chain)/.test(normalized)) return 'manufacturing'
  if (/(design|ux|ui|figma|creative)/.test(normalized)) return 'design'
  if (/(consult|advisor|strategy)/.test(normalized)) return 'consulting'
  if (/(ai|ml|machine learning|data|analytics)/.test(normalized)) return 'ai_data'
  if (/(government|public|policy|civil)/.test(normalized)) return 'government'
  return 'technology'
}

export function calculateIndustryConfidenceScore(data: Pick<IndustryOutlook, 'growthRate' | 'demandLevel' | 'yearlyMarketData'>) {
  const clamp = (value: number) => Math.max(0, Math.min(100, value))
  const growthScore = clamp(data.growthRate * 3.5)
  const demandScore = data.demandLevel === 'Very High' ? 92 : data.demandLevel === 'High' ? 82 : 68

  const demandSeries = data.yearlyMarketData.map((point) => point.demand)
  const demandDeltas = demandSeries.slice(1).map((value, index) => value - demandSeries[index])
  const demandDeltaMean =
    demandDeltas.reduce((sum, value) => sum + value, 0) / Math.max(1, demandDeltas.length)
  const demandDeltaVariance =
    demandDeltas.reduce((sum, value) => sum + (value - demandDeltaMean) ** 2, 0) / Math.max(1, demandDeltas.length)
  const demandDeltaStdDev = Math.sqrt(demandDeltaVariance)
  const hiringConsistencyScore = clamp(100 - demandDeltaStdDev * 18)

  const salarySeries = data.yearlyMarketData.map((point) => point.salary)
  const salaryGrowthRates = salarySeries
    .slice(1)
    .map((value, index) => ((value - salarySeries[index]) / Math.max(1, salarySeries[index])) * 100)
  const salaryGrowthMean =
    salaryGrowthRates.reduce((sum, value) => sum + value, 0) / Math.max(1, salaryGrowthRates.length)
  const salaryGrowthVariance =
    salaryGrowthRates.reduce((sum, value) => sum + (value - salaryGrowthMean) ** 2, 0) / Math.max(1, salaryGrowthRates.length)
  const salaryGrowthStdDev = Math.sqrt(salaryGrowthVariance)
  const salaryStabilityScore = clamp(100 - salaryGrowthStdDev * 20)

  const weightedScore =
    growthScore * 0.35 +
    demandScore * 0.25 +
    hiringConsistencyScore * 0.2 +
    salaryStabilityScore * 0.2

  return Math.round(clamp(weightedScore))
}

export function formatINR(amount: number): string {
  const safeAmount = Number.isFinite(amount) ? Math.round(amount) : 0
  return `₹${safeAmount.toLocaleString('en-IN')}`
}

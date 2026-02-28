export type DemandLevel = 'Very High' | 'High' | 'Moderate'

export type YearlySalaryPoint = {
  year: number
  salary: number
}

export type YearlyHiringPoint = {
  year: number
  demand: number
}

export type SkillDemandPoint = {
  name: string
  pct: number
}

export type IndustryInsightsData = {
  label: string
  summary: string
  growthRate: number
  demandLevel: DemandLevel
  avgSalary: number
  salaryTrend: YearlySalaryPoint[]
  hiringTrend: YearlyHiringPoint[]
  skillsInDemand: SkillDemandPoint[]
  sectors: string[]
}

const BASE_YEARS = [2019, 2020, 2021, 2022, 2023, 2024]

function buildSalaryTrend(start: number, end: number): YearlySalaryPoint[] {
  return BASE_YEARS.map((year, index) => ({
    year,
    salary: Math.round(start + ((end - start) * (index / (BASE_YEARS.length - 1)))),
  }))
}

function buildHiringTrend(values: number[]): YearlyHiringPoint[] {
  return BASE_YEARS.map((year, index) => ({ year, demand: values[index] || values[values.length - 1] || 8 }))
}

export const INSIGHTS_DATA_BY_INDUSTRY: Record<string, IndustryInsightsData> = {
  technology: {
    label: 'Technology',
    summary: 'Cloud, AI adoption, and platform engineering continue to drive broad hiring demand.',
    growthRate: 0.19,
    demandLevel: 'Very High',
    avgSalary: 1550000,
    salaryTrend: buildSalaryTrend(980000, 1550000),
    hiringTrend: buildHiringTrend([11, 13, 15, 16, 17, 19]),
    skillsInDemand: [
      { name: 'Cloud Engineering', pct: 21 },
      { name: 'TypeScript', pct: 18 },
      { name: 'System Design', pct: 17 },
      { name: 'AI Integration', pct: 23 },
      { name: 'DevSecOps', pct: 15 },
      { name: 'Observability', pct: 14 },
    ],
    sectors: ['SaaS', 'FinTech', 'HealthTech', 'Developer Platforms'],
  },
  healthcare: {
    label: 'Healthcare',
    summary: 'Digital health systems and hospital modernization are expanding data and operations demand.',
    growthRate: 0.14,
    demandLevel: 'High',
    avgSalary: 1280000,
    salaryTrend: buildSalaryTrend(840000, 1280000),
    hiringTrend: buildHiringTrend([8, 9, 10, 11, 12, 14]),
    skillsInDemand: [
      { name: 'Health Informatics', pct: 16 },
      { name: 'Clinical Data Systems', pct: 15 },
      { name: 'Compliance', pct: 13 },
      { name: 'Healthcare Analytics', pct: 18 },
      { name: 'Process Automation', pct: 14 },
      { name: 'Patient Experience', pct: 12 },
    ],
    sectors: ['Hospitals', 'Diagnostics', 'Pharma Tech', 'Telemedicine'],
  },
  finance: {
    label: 'Finance',
    summary: 'Risk automation and digital-first banking continue to sustain premium demand for finance talent.',
    growthRate: 0.15,
    demandLevel: 'High',
    avgSalary: 1620000,
    salaryTrend: buildSalaryTrend(1020000, 1620000),
    hiringTrend: buildHiringTrend([9, 10, 11, 12, 13, 15]),
    skillsInDemand: [
      { name: 'Risk Analytics', pct: 17 },
      { name: 'Regulatory Reporting', pct: 13 },
      { name: 'Fraud Detection', pct: 16 },
      { name: 'Financial Modeling', pct: 14 },
      { name: 'Data Governance', pct: 12 },
      { name: 'Automation', pct: 15 },
    ],
    sectors: ['Banking', 'Insurance', 'NBFCs', 'Capital Markets'],
  },
  education: {
    label: 'Education',
    summary: 'EdTech product expansion and hybrid learning models are driving stable hiring demand.',
    growthRate: 0.11,
    demandLevel: 'Moderate',
    avgSalary: 980000,
    salaryTrend: buildSalaryTrend(640000, 980000),
    hiringTrend: buildHiringTrend([6, 7, 8, 8, 9, 10]),
    skillsInDemand: [
      { name: 'Learning Design', pct: 13 },
      { name: 'Student Analytics', pct: 12 },
      { name: 'Curriculum Ops', pct: 10 },
      { name: 'Platform Management', pct: 14 },
      { name: 'Assessment Systems', pct: 11 },
      { name: 'Content Strategy', pct: 9 },
    ],
    sectors: ['EdTech', 'Higher Education', 'Corporate Learning', 'Test Prep'],
  },
  ecommerce: {
    label: 'E-commerce',
    summary: 'Omnichannel growth and logistics optimization are sustaining high marketplace hiring.',
    growthRate: 0.17,
    demandLevel: 'High',
    avgSalary: 1350000,
    salaryTrend: buildSalaryTrend(860000, 1350000),
    hiringTrend: buildHiringTrend([8, 10, 12, 13, 14, 16]),
    skillsInDemand: [
      { name: 'Growth Analytics', pct: 18 },
      { name: 'Marketplace Ops', pct: 14 },
      { name: 'Performance Marketing', pct: 16 },
      { name: 'Supply Chain Tech', pct: 15 },
      { name: 'Pricing Strategy', pct: 12 },
      { name: 'CRM Automation', pct: 13 },
    ],
    sectors: ['Marketplaces', 'D2C Brands', 'Retail Tech', 'Quick Commerce'],
  },
  manufacturing: {
    label: 'Manufacturing',
    summary: 'Industry 4.0 investments are raising demand for digital operations and automation talent.',
    growthRate: 0.12,
    demandLevel: 'Moderate',
    avgSalary: 1120000,
    salaryTrend: buildSalaryTrend(760000, 1120000),
    hiringTrend: buildHiringTrend([7, 8, 9, 10, 10, 11]),
    skillsInDemand: [
      { name: 'Process Automation', pct: 15 },
      { name: 'Quality Systems', pct: 12 },
      { name: 'Industrial IoT', pct: 17 },
      { name: 'Production Planning', pct: 11 },
      { name: 'Lean Operations', pct: 10 },
      { name: 'Maintenance Analytics', pct: 13 },
    ],
    sectors: ['Automotive', 'Electronics', 'Industrial Equipment', 'FMCG'],
  },
  design: {
    label: 'Design',
    summary: 'Design systems and product-led brand experiences are creating steady cross-functional demand.',
    growthRate: 0.1,
    demandLevel: 'Moderate',
    avgSalary: 1180000,
    salaryTrend: buildSalaryTrend(760000, 1180000),
    hiringTrend: buildHiringTrend([5, 6, 7, 8, 9, 10]),
    skillsInDemand: [
      { name: 'Design Systems', pct: 14 },
      { name: 'UX Research', pct: 11 },
      { name: 'Prototyping', pct: 10 },
      { name: 'Accessibility', pct: 12 },
      { name: 'Product Storytelling', pct: 9 },
      { name: 'AI-assisted Design', pct: 16 },
    ],
    sectors: ['Product Design', 'Brand Studios', 'Design Agencies', 'Digital Media'],
  },
  consulting: {
    label: 'Consulting',
    summary: 'Digital transformation programs continue to increase consulting and advisory hiring.',
    growthRate: 0.13,
    demandLevel: 'High',
    avgSalary: 1460000,
    salaryTrend: buildSalaryTrend(920000, 1460000),
    hiringTrend: buildHiringTrend([8, 9, 10, 11, 12, 13]),
    skillsInDemand: [
      { name: 'Business Analysis', pct: 13 },
      { name: 'Program Delivery', pct: 12 },
      { name: 'Stakeholder Management', pct: 11 },
      { name: 'Process Re-engineering', pct: 14 },
      { name: 'Data-driven Strategy', pct: 15 },
      { name: 'Change Management', pct: 10 },
    ],
    sectors: ['Management Consulting', 'Tech Consulting', 'Advisory', 'Operations'],
  },
  ai_data: {
    label: 'AI & Data',
    summary: 'Generative AI and enterprise analytics programs are driving top-tier hiring demand.',
    growthRate: 0.22,
    demandLevel: 'Very High',
    avgSalary: 1680000,
    salaryTrend: buildSalaryTrend(1060000, 1680000),
    hiringTrend: buildHiringTrend([10, 11, 13, 15, 17, 20]),
    skillsInDemand: [
      { name: 'Machine Learning', pct: 21 },
      { name: 'MLOps', pct: 22 },
      { name: 'Data Engineering', pct: 18 },
      { name: 'LLM Ops', pct: 24 },
      { name: 'Experimentation', pct: 14 },
      { name: 'Model Monitoring', pct: 16 },
    ],
    sectors: ['AI Platforms', 'Enterprise Analytics', 'Data Products', 'Automation'],
  },
  government: {
    label: 'Government',
    summary: 'Digital public infrastructure and e-governance projects are sustaining reliable hiring.',
    growthRate: 0.09,
    demandLevel: 'Moderate',
    avgSalary: 930000,
    salaryTrend: buildSalaryTrend(620000, 930000),
    hiringTrend: buildHiringTrend([6, 6, 7, 8, 8, 9]),
    skillsInDemand: [
      { name: 'Policy Analytics', pct: 10 },
      { name: 'Program Monitoring', pct: 11 },
      { name: 'Digital Governance', pct: 13 },
      { name: 'Public Data Systems', pct: 12 },
      { name: 'Cybersecurity', pct: 14 },
      { name: 'Service Delivery', pct: 9 },
    ],
    sectors: ['Public Services', 'Smart Cities', 'Digital Identity', 'Regulatory Tech'],
  },
}

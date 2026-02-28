export type ExperienceLevel = 'Beginner' | 'Intermediate' | 'Advanced'

export type RoadmapStageName = 'Beginner' | 'Intermediate' | 'Advanced'

export type CoursePricing = 'FREE' | 'PAID'

export type ProjectDifficulty = 'Beginner' | 'Intermediate' | 'Advanced'

export type SkillLensInput = {
  currentRoleOrField: string
  currentSkills: string[]
  experienceLevel: ExperienceLevel
  targetRole: string
}

export type SkillLensCourse = {
  title: string
  provider: string
  url?: string
  pricing: CoursePricing
  reason: string
}

export type SkillLensRoadmapStage = {
  stage: RoadmapStageName
  focus: string
  timeframe: string
  milestones: string[]
}

export type SkillLensProject = {
  name: string
  purpose: string
  demonstratedSkills: string[]
  difficulty: ProjectDifficulty
}

export type SkillLensAnalysis = {
  summaryMessage: string
  currentSkillSummary: string
  skillGapAnalysis: string[]
  roadmapStages: SkillLensRoadmapStage[]
  highlyRecommendedCourses: SkillLensCourse[]
  additionalCourses: SkillLensCourse[]
  projects: SkillLensProject[]
  generatedAt: string
}

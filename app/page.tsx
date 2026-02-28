import Link from 'next/link'
import Navbar from '@/components/navbar'
import HeroSpline from '@/components/HeroSpline'
import { IndustryInsightsAction } from '@/components/home-access-ui'

export default function Home() {
  return (
    <div className="bg-background">
      <Navbar />

      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <HeroSpline />
        </div>

        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent z-10 pointer-events-none" />

        <div className="relative z-20 max-w-4xl ml-24 md:ml-40 pt-56 pb-32">
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight max-w-2xl">
            Master Your Career <br /> with AI
          </h1>

          <p className="mt-8 text-lg text-gray-300 max-w-lg">
            Practice interviews, run AI skill-gap analysis, discover learning paths,
            and build your resume with AI-powered tools designed for your success.
          </p>

          <div className="mt-10 flex flex-wrap gap-4">
            <Link
              href="/interview"
              className="px-7 py-3 rounded-xl bg-red-600 hover:bg-red-700 transition font-medium shadow-lg shadow-red-600/30"
            >
              Try Interview Coach
            </Link>

            <Link
              href="/skilllens"
              className="px-7 py-3 rounded-xl border border-white/30 hover:bg-white/10 transition font-medium"
            >
              Explore Learning Paths
            </Link>
          </div>

          <p className="mt-6 text-sm text-gray-400">
            Guest access includes 2 interview starts every 24 hours.
            Sign up for unlimited access.
          </p>
        </div>
      </section>

      <section id="features" className="py-20 md:py-32">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">Everything You Need</h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">Four powerful tools to advance your career</p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="group relative rounded-xl border border-border bg-card p-8 transition-all hover:border-accent/40">
              <div className="mb-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
                  <span className="text-2xl">IC</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground">AI Interview Coach</h3>
              </div>
              <p className="mb-6 text-muted-foreground">
                Practice with realistic interviews in Realistic Mode or get coaching tips in Coaching Mode. Get scored feedback and improve.
              </p>
              <ul className="mb-6 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-primary">+</span> Realistic and Coaching modes
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">+</span> Voice and text input
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">+</span> Performance scorecard
                </li>
              </ul>
              <Link href="/interview" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80">
                Start Practicing
              </Link>
            </div>

            <div className="group relative rounded-xl border border-border bg-card p-8 transition-all hover:border-accent/40">
              <div className="mb-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/20">
                  <span className="text-2xl">SL</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground">SkillLens</h3>
              </div>
              <p className="mb-6 text-muted-foreground">
                AI-powered skill analysis with roadmap stages, targeted courses, and practical projects from Beginner to Advanced.
              </p>
              <ul className="mb-6 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-accent">+</span> Role-based roadmaps
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">+</span> Recommended courses
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">+</span> Skill gap analysis
                </li>
              </ul>
              <Link href="/skilllens" className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent/80">
                Explore Paths
              </Link>
            </div>

            <div className="group relative rounded-xl border border-border bg-card p-8 transition-all hover:border-accent/40">
              <div className="mb-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/20">
                  <span className="text-2xl">II</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground">Industry Insights</h3>
              </div>
              <p className="mb-6 text-muted-foreground">
                Explore market outlook, growth trends, in-demand skills, and salary data for your target industry. Login required.
              </p>
              <ul className="mb-6 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-primary">+</span> Market analysis
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">+</span> Top skills data
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-primary">+</span> Salary insights
                </li>
              </ul>
              <IndustryInsightsAction />
            </div>

            <div className="group relative rounded-xl border border-border bg-card p-8 transition-all hover:border-accent/40">
              <div className="mb-6">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/20">
                  <span className="text-2xl">RB</span>
                </div>
                <h3 className="text-xl font-semibold text-foreground">Resume Builder</h3>
              </div>
              <p className="mb-6 text-muted-foreground">
                Build professional resumes with AI-powered bullet point improvements and export to PDF. Multi-step guided form.
              </p>
              <ul className="mb-6 space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <span className="text-accent">+</span> AI bullet improvement
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">+</span> Live preview
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-accent">+</span> PDF export
                </li>
              </ul>
              <Link href="/resume" className="inline-flex items-center gap-2 text-sm font-medium text-accent hover:text-accent/80">
                Build Resume
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}


import Link from 'next/link'
import { Space_Grotesk } from 'next/font/google'
import Navbar from '@/components/navbar'
import { Button } from '@/components/ui/button'

const aboutFont = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
})

export default function AboutPage() {
  return (
    <div className="bg-background">
      <Navbar />

      <section className="border-y border-[rgba(42,31,47,0.6)] bg-[radial-gradient(circle_at_20%_0%,rgba(43,21,51,0.2),transparent_35%),linear-gradient(180deg,#1B1024_0%,#0B0A12_100%)]">
        <div className="py-20">
          <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#A78BBF]">About Coach AI</p>
              <h1 className={`${aboutFont.className} text-4xl font-bold tracking-tight text-foreground md:text-5xl`}>About Coach AI</h1>
              <div className={`${aboutFont.className} max-w-3xl space-y-2 text-lg leading-relaxed text-muted-foreground`}>
                <p>Coach AI is an AI-powered interview preparation and career insights platform for students and early professionals.</p>
                <p>It combines mock interviews, skill-gap roadmaps, resume optimization, and industry signals in one place.</p>
                <p>The product helps users move from practice to measurable progress with clear, actionable feedback loops.</p>
                <p>Instead of fragmented tools, Coach AI provides one guided workflow for planning, execution, and improvement.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="py-20">
          <div className="mx-auto max-w-5xl space-y-8 px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-semibold text-foreground">The Problem</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[rgba(42,31,47,0.6)] bg-[rgba(7,25,22,0.75)] p-6">
                <p className="text-sm text-muted-foreground">
                  Career tools are fragmented across interview prep apps, course platforms, resume editors, and separate labor-market reports.
                </p>
              </div>
              <div className="rounded-2xl border border-[rgba(42,31,47,0.6)] bg-[rgba(7,25,22,0.75)] p-6">
                <p className="text-sm text-muted-foreground">
                  Learners often operate without structured mentorship, making progress inconsistent and difficult to track.
                </p>
              </div>
              <div className="rounded-2xl border border-[rgba(42,31,47,0.6)] bg-[rgba(7,25,22,0.75)] p-6">
                <p className="text-sm text-muted-foreground">
                  ATS-based filtering rejects resumes that lack optimization, even when candidates have the right capabilities.
                </p>
              </div>
              <div className="rounded-2xl border border-[rgba(42,31,47,0.6)] bg-[rgba(7,25,22,0.75)] p-6">
                <p className="text-sm text-muted-foreground">
                  Skill development roadmaps are often unclear, leaving users unsure which competencies to prioritize next.
                </p>
              </div>
            </div>
            <div className="rounded-2xl border border-[#6B1F2A]/40 bg-[linear-gradient(135deg,rgba(107,31,42,0.24),rgba(15,55,47,0.7))] p-7 shadow-[0_8px_30px_rgba(10,38,31,0.4)]">
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-[#b5f1db]">The Gap</p>
              <p className="mt-3 text-base leading-relaxed text-foreground">
                Students and early professionals need a unified, intelligent, and mentorship-aligned ecosystem that connects preparation, execution, and improvement in one loop.
              </p>
            </div>
          </div>
        </div>

        <div className="py-20">
          <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-semibold text-foreground">Our Solution</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              Coach AI unifies AI Interview Coaching, personalized SkillLens learning roadmaps, a resume builder with ATS analysis, and data-driven industry analytics in one intelligent platform. The system closes feedback loops across preparation, profile quality, and market awareness to help users make faster, evidence-based career decisions.
            </p>
          </div>
        </div>

        <div className="py-20">
          <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-semibold text-foreground">System Architecture</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[rgba(42,31,47,0.6)] bg-[rgba(7,25,22,0.75)] p-6 transition-all duration-300 hover:border-[#6B1F2A]/45">
                <p className="text-sm font-semibold text-foreground">Frontend</p>
                <p className="mt-2 text-sm text-muted-foreground">Built with Next.js 16 and React 19 for responsive, component-driven user interfaces.</p>
              </div>
              <div className="rounded-2xl border border-[rgba(42,31,47,0.6)] bg-[rgba(7,25,22,0.75)] p-6 transition-all duration-300 hover:border-[#6B1F2A]/45">
                <p className="text-sm font-semibold text-foreground">Backend</p>
                <p className="mt-2 text-sm text-muted-foreground">Powered by Supabase PostgreSQL with Row Level Security for protected multi-user data access.</p>
              </div>
              <div className="rounded-2xl border border-[rgba(42,31,47,0.6)] bg-[rgba(7,25,22,0.75)] p-6 transition-all duration-300 hover:border-[#6B1F2A]/45">
                <p className="text-sm font-semibold text-foreground">AI Integration</p>
                <p className="mt-2 text-sm text-muted-foreground">Claude and Groq APIs drive interview simulation, feedback generation, and skill intelligence workflows.</p>
              </div>
              <div className="rounded-2xl border border-[rgba(42,31,47,0.6)] bg-[rgba(7,25,22,0.75)] p-6 transition-all duration-300 hover:border-[#6B1F2A]/45">
                <p className="text-sm font-semibold text-foreground">Modular Design</p>
                <p className="mt-2 text-sm text-muted-foreground">Feature modules are decoupled and reusable, enabling rapid extension for future academic and production iterations.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="py-20">
          <div className="mx-auto max-w-5xl space-y-8 px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-semibold text-foreground">Core Modules</h2>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-2xl border border-[rgba(42,31,47,0.65)] bg-[rgba(9,33,28,0.85)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#6B1F2A]/50 hover:shadow-[0_16px_40px_rgba(7,24,21,0.45)]">
                <p className="text-lg font-semibold text-foreground">Interview Coach</p>
                <p className="mt-2 text-sm text-muted-foreground">Context-aware interview simulation with scoring and iterative coaching feedback.</p>
              </div>
              <div className="rounded-2xl border border-[rgba(42,31,47,0.65)] bg-[rgba(9,33,28,0.85)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#6B1F2A]/50 hover:shadow-[0_16px_40px_rgba(7,24,21,0.45)]">
                <p className="text-lg font-semibold text-foreground">SkillLens</p>
                <p className="mt-2 text-sm text-muted-foreground">Personalized learning roadmaps aligned to target roles and current competency gaps.</p>
              </div>
              <div className="rounded-2xl border border-[rgba(42,31,47,0.65)] bg-[rgba(9,33,28,0.85)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#6B1F2A]/50 hover:shadow-[0_16px_40px_rgba(7,24,21,0.45)]">
                <p className="text-lg font-semibold text-foreground">Resume Builder</p>
                <p className="mt-2 text-sm text-muted-foreground">Guided resume authoring with structured professional formatting and AI refinement.</p>
              </div>
              <div className="rounded-2xl border border-[rgba(42,31,47,0.65)] bg-[rgba(9,33,28,0.85)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#6B1F2A]/50 hover:shadow-[0_16px_40px_rgba(7,24,21,0.45)]">
                <p className="text-lg font-semibold text-foreground">ATS Checker</p>
                <p className="mt-2 text-sm text-muted-foreground">Compatibility analysis that flags structural and keyword issues affecting screening outcomes.</p>
              </div>
              <div className="rounded-2xl border border-[rgba(42,31,47,0.65)] bg-[rgba(9,33,28,0.85)] p-6 transition-all duration-300 hover:-translate-y-1 hover:border-[#6B1F2A]/50 hover:shadow-[0_16px_40px_rgba(7,24,21,0.45)] md:col-span-2 xl:col-span-1">
                <p className="text-lg font-semibold text-foreground">Industry Insights</p>
                <p className="mt-2 text-sm text-muted-foreground">Market trend intelligence and role-specific demand signals for strategic planning.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="py-20">
          <div className="mx-auto max-w-5xl space-y-8 px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-semibold text-foreground">Technology Stack</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl border border-[rgba(42,31,47,0.6)] bg-[rgba(7,25,22,0.75)] p-6">
                <p className="text-sm font-semibold text-foreground">Frontend</p>
                <p className="mt-2 text-sm text-muted-foreground">Next.js 16, React 19, Tailwind CSS, component-driven architecture.</p>
              </div>
              <div className="rounded-2xl border border-[rgba(42,31,47,0.6)] bg-[rgba(7,25,22,0.75)] p-6">
                <p className="text-sm font-semibold text-foreground">Backend and Database</p>
                <p className="mt-2 text-sm text-muted-foreground">Supabase APIs, PostgreSQL persistence, and Row Level Security controls.</p>
              </div>
              <div className="rounded-2xl border border-[rgba(42,31,47,0.6)] bg-[rgba(7,25,22,0.75)] p-6">
                <p className="text-sm font-semibold text-foreground">AI Models</p>
                <p className="mt-2 text-sm text-muted-foreground">Claude and Groq model integrations for adaptive generation and evaluation tasks.</p>
              </div>
              <div className="rounded-2xl border border-[rgba(42,31,47,0.6)] bg-[rgba(7,25,22,0.75)] p-6">
                <p className="text-sm font-semibold text-foreground">Deployment</p>
                <p className="mt-2 text-sm text-muted-foreground">Cloud deployment with managed runtime pipelines and scalable serverless delivery.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="py-20">
          <div className="mx-auto max-w-5xl space-y-6 px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-semibold text-foreground">Academic Objectives and Impact</h2>
            <p className="text-base leading-relaxed text-muted-foreground">
              This project investigates how AI can operationalize career guidance by combining conversational coaching, structured recommendation, and labor-market analytics. As a final-year academic system, Coach AI demonstrates end-to-end engineering rigor while addressing real employability challenges faced by students and early-career professionals.
            </p>
          </div>
        </div>

        <div className="py-20">
          <div className="mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            <div className="rounded-3xl border border-[rgba(42,31,47,0.65)] bg-[linear-gradient(145deg,rgba(8,29,24,0.9),rgba(11,43,38,0.88))] p-10">
              <h2 className="text-3xl font-bold text-foreground md:text-4xl">Ready to Elevate Your Career with AI?</h2>
              <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground">
                Start with intelligent interview practice or build your personalized growth roadmap through SkillLens.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
                <Link href="/interview">
                  <Button size="lg" className="w-full transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(107,31,42,0.35)] sm:w-auto">
                    Interview Coach
                  </Button>
                </Link>
                <Link href="/skilllens">
                  <Button size="lg" variant="outline" className="w-full border-[rgba(42,31,47,0.8)] bg-transparent transition-all duration-300 hover:border-[#6B1F2A]/70 hover:text-[#F3F4F6] sm:w-auto">
                    SkillLens
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}


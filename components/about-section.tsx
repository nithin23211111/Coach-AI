'use client'

export function AboutSection() {
  return (
    <section className="py-20 md:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-12 lg:grid-cols-3">
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-foreground">About This Project</h3>
            <p className="leading-relaxed text-muted-foreground">
              Coach AI is an academic AI-powered career coaching platform designed to help professionals at all levels
              advance their careers. Built with modern web technologies and powered by cutting-edge AI models.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-foreground">The Problem</h3>
            <p className="leading-relaxed text-muted-foreground">
              Career advancement requires multiple skills: polished communication, up-to-date technical knowledge,
              strong professional networks, and personalized guidance. Many individuals lack access to quality
              mentorship and tools to develop these competencies.
            </p>
          </div>
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-foreground">Technology Stack</h3>
            <ul className="space-y-2 text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="text-primary">→</span> Next.js 16 & React 19
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">→</span> Supabase PostgreSQL
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">→</span> Claude, Grok, Groq AI
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary">→</span> Spline 3D Avatar
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="bg-black text-white pt-16 pb-8">
      <div className="max-w-6xl mx-auto px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-start gap-12">
          <div>
            <h2 className="text-3xl font-semibold">Coach AI</h2>
            <div className="space-y-2 mt-4">
              <div className="w-32 h-[2px] bg-white" />
              <div className="w-24 h-[2px] bg-white" />
              <div className="w-20 h-[2px] bg-white" />
            </div>
          </div>

          <div>
            <h3 className="text-2xl font-semibold">Our Tools</h3>
            <ul className="space-y-3 mt-6 text-slate-300">
              <li>
                <Link href="/interview" className="hover:text-white transition-colors duration-200">
                  Interview Coach
                </Link>
              </li>
              <li>
                <Link href="/skilllens" className="hover:text-white transition-colors duration-200">
                  SkillLens
                </Link>
              </li>
              <li>
                <Link href="/insights" className="hover:text-white transition-colors duration-200">
                  Industry Insights
                </Link>
              </li>
              <li>
                <Link href="/resume" className="hover:text-white transition-colors duration-200">
                  Resume Builder
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/40 mt-12" />
        <p className="text-sm text-slate-400 text-center mt-6">
          Coach AI &mdash; Made by Shreya Parulekar &amp; Shravani Aainchi
        </p>
      </div>
    </footer>
  )
}

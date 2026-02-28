'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import { Menu, X, LayoutDashboard, LogOut, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useAccessControl } from '@/hooks/use-access-control'

const navLinks = [
  { href: '/interview', label: 'Interview Coach' },
  { href: '/skilllens', label: 'SkillLens' },
  { href: '/insights', label: 'Industry Insights' },
  { href: '/resume', label: 'Resume Builder' },
  { href: '/about', label: 'About' },
]

function getUserDisplay(user: User | null) {
  const email = user?.email ?? ''
  const fullName =
    (user?.user_metadata?.full_name as string | undefined) ||
    (user?.user_metadata?.name as string | undefined) ||
    email.split('@')[0] ||
    'User'

  const initials = fullName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')

  return {
    fullName,
    email,
    initials: initials || 'U',
  }
}

export default function Navbar() {
  const { loading, user, isAuthenticated } = useAccessControl()
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const userDisplay = useMemo(() => getUserDisplay(user), [user])
  const visibleNavLinks = navLinks

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-50 border-b border-slate-700/35 bg-[rgba(6,20,27,0.72)] backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[linear-gradient(135deg,#6B1F2A,#2B1533)]">
            <Sparkles className="h-4 w-4 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-foreground">Coach AI</span>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-1 lg:flex">
          {visibleNavLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={`rounded-md px-3 py-2 text-sm font-medium transition hover:text-[#F3F4F6] ${
                pathname === link.href && link.href !== '/about'
                  ? 'text-[#6B1F2A]'
                  : 'text-muted-foreground'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          {!loading && !isAuthenticated && (
            <Link href="/auth/signup">
              <Button
                variant="ghost"
                size="sm"
                className="border border-[rgba(42,31,47,0.75)] text-foreground hover:bg-[rgba(43,21,51,0.3)] hover:text-[#F3F4F6]"
              >
                Sign In / Sign Up
              </Button>
            </Link>
          )}

          {!loading && isAuthenticated && (
            <div className="flex items-center gap-3 rounded-2xl border border-white/6 bg-card/80 px-3 py-2 backdrop-blur-sm">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/35 text-xs font-semibold text-foreground">
                {userDisplay.initials}
              </div>
              <div className="max-w-[180px] leading-tight">
                <p className="truncate text-sm font-medium text-foreground">{userDisplay.fullName}</p>
                <p className="truncate text-xs text-muted-foreground">{userDisplay.email}</p>
              </div>
              <Link href="/dashboard" className="text-sm font-medium text-[#6B1F2A] hover:text-[#F3F4F6]">
                Dashboard
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-foreground hover:bg-[rgba(43,21,51,0.3)] hover:text-[#F3F4F6]"
              >
                Sign Out
              </Button>
            </div>
          )}
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="ml-auto text-foreground hover:bg-[rgba(43,21,51,0.3)] hover:text-[#F3F4F6] lg:hidden"
          onClick={() => setMobileOpen((open) => !open)}
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {mobileOpen && (
        <div className="border-t border-slate-700/35 bg-[rgba(6,20,27,0.9)] px-4 py-4 lg:hidden backdrop-blur-xl">
          <nav className="mb-4 flex flex-col gap-1">
            {visibleNavLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className={`rounded-md px-3 py-2 text-sm font-medium transition hover:text-[#F3F4F6] ${
                  pathname === link.href && link.href !== '/about'
                    ? 'text-[#6B1F2A]'
                    : 'text-muted-foreground'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {!loading && !isAuthenticated && (
            <Link href="/auth/signup" className="block">
              <Button
                variant="ghost"
                className="w-full border border-[rgba(42,31,47,0.75)] text-foreground hover:bg-[rgba(43,21,51,0.3)] hover:text-[#F3F4F6]"
              >
                Sign In / Sign Up
              </Button>
            </Link>
          )}

          {!loading && isAuthenticated && (
            <div className="space-y-3 rounded-2xl border border-white/6 bg-card/80 p-3 backdrop-blur-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/35 text-xs font-semibold text-foreground">
                  {userDisplay.initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{userDisplay.fullName}</p>
                  <p className="truncate text-xs text-muted-foreground">{userDisplay.email}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link href="/dashboard" className="flex-1">
                  <Button
                    variant="ghost"
                    className="w-full justify-center border border-[rgba(42,31,47,0.75)] text-foreground hover:bg-[rgba(43,21,51,0.3)] hover:text-[#F3F4F6]"
                  >
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  onClick={handleSignOut}
                  className="flex-1 justify-center border border-[rgba(42,31,47,0.75)] text-foreground hover:bg-[rgba(43,21,51,0.3)] hover:text-[#F3F4F6]"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  )
}



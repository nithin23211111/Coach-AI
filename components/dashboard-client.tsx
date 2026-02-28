'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { signOut } from '@/lib/auth'

interface Session {
  id: string
  title: string
  created_at: string
  status: string
}

export default function DashboardClient() {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const response = await fetch('/api/coaching/sessions')
        if (!response.ok) throw new Error('Failed to fetch sessions')
        const data = await response.json()
        setSessions(data)
      } catch (error) {
        toast.error('Failed to load sessions')
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchSessions()
  }, [])

  const handleNewSession = async () => {
    setCreating(true)
    try {
      const response = await fetch('/api/coaching/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'New Coaching Session' }),
      })

      if (!response.ok) throw new Error('Failed to create session')

      const newSession = await response.json()
      toast.success('Coaching session created!')
      router.push(`/dashboard/coaching/${newSession.id}`)
    } catch (error) {
      toast.error('Failed to create session')
      console.error(error)
    } finally {
      setCreating(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      toast.error('Failed to sign out')
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/70 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[linear-gradient(135deg,#854F6C,#522B5B)] rounded-lg" />
            <h1 className="text-2xl font-bold text-foreground">Coach AI</h1>
          </div>
          <div className="flex gap-4">
            <Link href="/dashboard/settings">
              <Button variant="ghost">Settings</Button>
            </Link>
            <Button variant="outline" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="space-y-2">
            <h2 className="text-3xl font-bold text-foreground">
              Welcome to Your Coaching Dashboard
            </h2>
            <p className="text-muted-foreground">
              Start a new coaching session or continue with an existing one
            </p>
          </div>

          {/* New Session Button */}
          <Button
            onClick={handleNewSession}
            disabled={creating}
            size="lg"
            className="gap-2"
          >
            <Plus className="w-5 h-5" />
            {creating ? 'Creating Session...' : 'Start New Session'}
          </Button>

          {/* Sessions List */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-foreground">
              Your Coaching Sessions
            </h3>

            {loading ? (
              <div className="text-center py-12 text-muted-foreground">
                Loading sessions...
              </div>
            ) : sessions.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No sessions yet. Start your first coaching session to begin!
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {sessions.map((session) => (
                  <Link key={session.id} href={`/dashboard/coaching/${session.id}`}>
                    <Card className="cursor-pointer transition hover:border-accent/40">
                      <CardHeader>
                        <CardTitle className="text-lg">{session.title}</CardTitle>
                        <CardDescription>
                          Created {new Date(session.created_at).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

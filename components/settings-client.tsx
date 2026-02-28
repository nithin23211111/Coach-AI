'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'

interface Profile {
  id: string
  first_name: string
  last_name: string
  job_title: string
  bio: string
  industry: string
  years_experience: number
}

interface Preferences {
  id: string
  coaching_style: string
  tone: string
  preferred_ai_model: string
  focus_areas: string[]
}

export default function SettingsClient() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [preferences, setPreferences] = useState<Preferences | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, prefsRes] = await Promise.all([
          fetch('/api/user/profile'),
          fetch('/api/user/preferences'),
        ])

        if (!profileRes.ok || !prefsRes.ok) {
          throw new Error('Failed to fetch data')
        }

        const profileData = await profileRes.json()
        const prefsData = await prefsRes.json()

        setProfile(profileData.profile)
        setPreferences(prefsData)
      } catch (error) {
        toast.error('Failed to load settings')
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const handleProfileChange = (field: string, value: string | number) => {
    if (!profile) return
    setProfile({ ...profile, [field]: value })
  }

  const handlePreferencesChange = (field: string, value: string) => {
    if (!preferences) return
    setPreferences({ ...preferences, [field]: value })
  }

  const handleSaveProfile = async () => {
    if (!profile) return

    setSaving(true)
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile),
      })

      if (!response.ok) throw new Error('Failed to save profile')

      toast.success('Profile updated successfully!')
    } catch (error) {
      toast.error('Failed to save profile')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  const handleSavePreferences = async () => {
    if (!preferences) return

    setSaving(true)
    try {
      const response = await fetch('/api/user/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(preferences),
      })

      if (!response.ok) throw new Error('Failed to save preferences')

      toast.success('Preferences updated successfully!')
    } catch (error) {
      toast.error('Failed to save preferences')
      console.error(error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/70 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        {/* Profile Section */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
            <CardDescription>Update your personal and professional details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">First Name</label>
                <Input
                  value={profile?.first_name || ''}
                  onChange={(e) => handleProfileChange('first_name', e.target.value)}
                  placeholder="John"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Last Name</label>
                <Input
                  value={profile?.last_name || ''}
                  onChange={(e) => handleProfileChange('last_name', e.target.value)}
                  placeholder="Doe"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Job Title</label>
                <Input
                  value={profile?.job_title || ''}
                  onChange={(e) => handleProfileChange('job_title', e.target.value)}
                  placeholder="Senior Developer"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Industry</label>
                <Input
                  value={profile?.industry || ''}
                  onChange={(e) => handleProfileChange('industry', e.target.value)}
                  placeholder="Technology"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Years of Experience</label>
                <Input
                  type="number"
                  value={profile?.years_experience || ''}
                  onChange={(e) => handleProfileChange('years_experience', parseInt(e.target.value))}
                  placeholder="5"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Bio</label>
              <textarea
                value={profile?.bio || ''}
                onChange={(e) => handleProfileChange('bio', e.target.value)}
                placeholder="Tell us about yourself..."
                className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground"
                rows={4}
              />
            </div>
            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </Button>
          </CardContent>
        </Card>

        {/* Preferences Section */}
        <Card>
          <CardHeader>
            <CardTitle>Coaching Preferences</CardTitle>
            <CardDescription>Customize your coaching experience</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Coaching Style</label>
                <select
                  value={preferences?.coaching_style || ''}
                  onChange={(e) => handlePreferencesChange('coaching_style', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground"
                >
                  <option value="supportive">Supportive</option>
                  <option value="challenging">Challenging</option>
                  <option value="analytical">Analytical</option>
                  <option value="balanced">Balanced</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Communication Tone</label>
                <select
                  value={preferences?.tone || ''}
                  onChange={(e) => handlePreferencesChange('tone', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground"
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="friendly">Friendly</option>
                  <option value="formal">Formal</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Preferred AI Model</label>
                <select
                  value={preferences?.preferred_ai_model || ''}
                  onChange={(e) => handlePreferencesChange('preferred_ai_model', e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-card text-foreground"
                >
                  <option value="claude">Claude</option>
                  <option value="grok">Grok</option>
                  <option value="groq">Groq</option>
                </select>
              </div>
            </div>
            <Button onClick={handleSavePreferences} disabled={saving}>
              {saving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

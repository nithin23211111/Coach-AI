import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import PerformanceDashboardClient from '@/components/performance-dashboard-client'

export const metadata = {
  title: 'Performance Dashboard | Coach AI',
  description: 'Interview performance trends, weaknesses, and AI coaching tips.',
}

export default async function PerformanceDashboardPage() {
  const session = await getSession()
  if (!session?.user) {
    redirect('/auth/login')
  }

  const supabase = await createServerSupabaseClient()
  const { data, error } = await supabase
    .from('interview_performance')
    .select('id, role, overall_score, weaknesses, improvement_tips, created_at')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to load interview performance records:', error)
  }

  return <PerformanceDashboardClient records={data || []} />
}

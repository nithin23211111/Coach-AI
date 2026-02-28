import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import CoachingSessionClient from '@/components/coaching-session-client'

export const metadata = {
  title: 'Coaching Session | Coach AI',
  description: 'Your personal career coaching session',
}

interface Props {
  params: Promise<{ sessionId: string }>
}

export default async function CoachingPage({ params }: Props) {
  const session = await getSession()

  if (!session) {
    redirect('/auth/login')
  }

  const { sessionId } = await params

  return <CoachingSessionClient sessionId={sessionId} />
}

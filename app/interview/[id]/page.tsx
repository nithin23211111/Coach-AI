import { InterviewSessionClient } from '@/components/interview-session-client'
import { notFound } from 'next/navigation'

export default async function InterviewSessionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  if (!id) {
    notFound()
  }

  return <InterviewSessionClient sessionId={id} />
}

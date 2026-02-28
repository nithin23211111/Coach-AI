import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import SettingsClient from '@/components/settings-client'

export const metadata = {
  title: 'Settings | Coach AI',
  description: 'Manage your Coach AI settings and preferences',
}

export default async function SettingsPage() {
  const session = await getSession()

  if (!session) {
    redirect('/auth/login')
  }

  return <SettingsClient />
}

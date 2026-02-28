'use client'

import { Spinner } from '@/components/ui/spinner'

export function LoadingSpinner() {
  return (
    <div className="flex h-full w-full items-center justify-center rounded-2xl border border-white/8 bg-card/75 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Spinner className="size-5" />
        <span>Loading 3D experience...</span>
      </div>
    </div>
  )
}

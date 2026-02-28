'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { FEATURE_LABELS, GUEST_LIMITS, type FeatureKey } from '@/lib/access-control'

interface LimitReachedModalProps {
  open: boolean
  feature: FeatureKey | null
  onOpenChange: (open: boolean) => void
}

export function LimitReachedModal({ open, feature, onOpenChange }: LimitReachedModalProps) {
  const label = feature ? FEATURE_LABELS[feature] : 'Usage'
  const guestLimit = feature ? GUEST_LIMITS[feature] : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="border-white/8 bg-[rgba(43,18,76,0.86)] text-foreground backdrop-blur-md sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Limit Reached</DialogTitle>
          <DialogDescription className="text-muted-foreground">
            You have reached today&apos;s guest limit for {label}
            {guestLimit > 0 ? ` (${guestLimit}/day)` : ''}. Create an account to unlock higher limits and saved history.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-foreground hover:bg-[rgba(251,228,216,0.05)]">
            Continue as Guest
          </Button>
          <Button asChild>
            <Link href="/auth/signup">Sign Up</Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

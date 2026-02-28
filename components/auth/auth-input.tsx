import * as React from 'react'

import { cn } from '@/lib/utils'

type AuthInputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  id: string
  label: string
  error?: string
}

const AuthInput = React.forwardRef<HTMLInputElement, AuthInputProps>(
  ({ className, id, label, error, ...props }, ref) => {
    return (
      <div className="space-y-2">
        <label htmlFor={id} className="text-sm font-medium text-foreground/95">
          {label}
        </label>
        <input
          ref={ref}
          id={id}
          className={cn(
            'h-11 w-full rounded-lg border border-border bg-input px-4 text-sm text-foreground placeholder:text-muted-foreground/75 transition-all duration-200 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/70 disabled:cursor-not-allowed disabled:opacity-60',
            className
          )}
          {...props}
        />
        {error ? <p className="text-xs text-red-400">{error}</p> : null}
      </div>
    )
  }
)

AuthInput.displayName = 'AuthInput'

export { AuthInput }

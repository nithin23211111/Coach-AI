'use client'

import React from 'react'
import { LoadingSpinner } from '@/components/loading-spinner'

type HeroErrorBoundaryProps = {
  children: React.ReactNode
}

type HeroErrorBoundaryState = {
  hasError: boolean
}

export class HeroErrorBoundary extends React.Component<HeroErrorBoundaryProps, HeroErrorBoundaryState> {
  constructor(props: HeroErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): HeroErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.error('Hero Spline failed to render:', error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="hidden lg:block w-full h-[500px]">
          <LoadingSpinner />
        </div>
      )
    }

    return this.props.children
  }
}

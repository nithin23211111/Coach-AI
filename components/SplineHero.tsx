'use client'

import dynamic from 'next/dynamic'

const Spline = dynamic(() => import('@splinetool/react-spline'), {
  ssr: false,
})

export function SplineHero() {
  return (
    <div className="absolute inset-0 z-0 h-full w-full bg-transparent pointer-events-auto">
      <Spline scene="https://prod.spline.design/Rl0YJaXEhTo3xwFQ/scene.splinecode" />
    </div>
  )
}

'use client'

const PARTICLES = [
  { left: '8%', top: '74%', size: 4, duration: 12, delay: 0 },
  { left: '14%', top: '42%', size: 6, duration: 16, delay: 2 },
  { left: '22%', top: '80%', size: 5, duration: 14, delay: 1 },
  { left: '31%', top: '58%', size: 7, duration: 17, delay: 4 },
  { left: '38%', top: '27%', size: 4, duration: 13, delay: 3 },
  { left: '46%', top: '68%', size: 6, duration: 18, delay: 5 },
  { left: '54%', top: '36%', size: 5, duration: 15, delay: 2 },
  { left: '62%', top: '78%', size: 8, duration: 16, delay: 6 },
  { left: '71%', top: '48%', size: 5, duration: 14, delay: 3 },
  { left: '79%', top: '64%', size: 6, duration: 18, delay: 1 },
  { left: '86%', top: '24%', size: 4, duration: 11, delay: 2 },
  { left: '92%', top: '72%', size: 7, duration: 17, delay: 4 },
]

export function FloatingParticles() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      {PARTICLES.map((particle, index) => (
        <span
          key={`${particle.left}-${particle.top}-${index}`}
          className="floating-particle"
          style={{
            left: particle.left,
            top: particle.top,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animationDuration: `${particle.duration}s`,
            animationDelay: `${particle.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

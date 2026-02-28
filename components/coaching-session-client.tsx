'use client'

import { useState, useRef, useEffect } from 'react'
import { useChat } from '@ai-sdk/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, Send } from 'lucide-react'
import { DefaultChatTransport } from 'ai'
import { AboutSection } from '@/components/about-section'

interface CoachingSessionClientProps {
  sessionId: string
}

export default function CoachingSessionClient({ sessionId }: CoachingSessionClientProps) {
  const [model, setModel] = useState('claude')
  const scrollRef = useRef<HTMLDivElement>(null)

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: '/api/coaching/chat',
    body: {
      sessionId,
      model,
    },
    transport: new DefaultChatTransport({ api: '/api/coaching/chat' }),
  })

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  const onSubmit = (e: React.FormEvent) => {
    if (!input.trim()) {
      e.preventDefault()
      return
    }
    handleSubmit(e)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card/70 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">
              Coaching Session
            </h1>
          </div>
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-card text-foreground"
          >
            <option value="claude">Claude</option>
            <option value="grok">Grok</option>
            <option value="groq">Groq</option>
          </select>
        </div>
      </header>

      {/* Chat Area */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-64 text-center">
              <div className="space-y-4">
                <p className="text-lg text-muted-foreground">
                  Welcome to your coaching session!
                </p>
                <p className="text-muted-foreground max-w-md">
                  Tell your AI coach about your career goals, challenges, or questions. You'll receive personalized guidance tailored to your situation.
                </p>
              </div>
            </div>
          ) : (
            messages.map((message, i) => (
              <div
                key={i}
                className={`flex ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <Card
                  className={`max-w-md px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-[linear-gradient(135deg,#6B1F2A,#2B1533)] text-primary-foreground'
                      : 'bg-card text-foreground'
                  }`}
                >
                  <div className="text-sm whitespace-pre-wrap">
                    {message.content}
                  </div>
                </Card>
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <Card className="bg-card px-4 py-3">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
                </div>
              </Card>
            </div>
          )}
          <div ref={scrollRef} />
        </div>
      </main>

      {/* Input Area */}
      <footer className="border-t border-border bg-card/70 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <form onSubmit={onSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Ask your coach..."
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim()}
              size="icon"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </footer>
      <AboutSection />
    </div>
  )
}


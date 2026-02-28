import { createServerSupabaseClient } from '@/lib/supabase-server'
import { createAdminSupabaseClient } from '@/lib/supabase-admin'
import { getCurrentUser } from '@/lib/auth'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

type GenerateInterviewBody = {
  mode?: 'standard' | 'timed'
  sessionId?: string
  role?: string
  category?: string
  difficulty?: string
  sessionType?: 'full' | 'timed'
  questionNumber?: number
  totalQuestions?: number
}

type ErrorResponseBody = {
  ok: false
  error: {
    code: string
    message: string
    details?: string
  }
}

class ApiRouteError extends Error {
  status: number
  code: string
  details?: string

  constructor(message: string, status = 500, code = 'internal_error', details?: string) {
    super(message)
    this.status = status
    this.code = code
    this.details = details
  }
}

async function generateWithGemini(prompt: string, apiKey: string): Promise<string | null> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [{ text: prompt }],
            },
          ],
        }),
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API Error:', errorText)
      throw new Error(`Gemini request failed: ${errorText}`)
    }

    const data = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>
    }
    const generatedQuestion = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()
    return generatedQuestion || null
  } catch (error) {
    console.error('Gemini API Error:', error)
    throw error
  }
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && typeof error.message === 'string' && error.message.trim()) {
    return error.message
  }
  return String(error)
}

function errorJson(message: string, status = 500, code = 'internal_error', details?: string) {
  const body: ErrorResponseBody = {
    ok: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  }
  return NextResponse.json(body, { status })
}

export async function POST(request: Request) {
  try {
    const contentType = request.headers.get('content-type') ?? ''
    if (!contentType.toLowerCase().includes('application/json')) {
      return errorJson('Unsupported Media Type', 415, 'invalid_content_type', 'Content-Type must be application/json')
    }

    let body: GenerateInterviewBody
    try {
      body = (await request.json()) as GenerateInterviewBody
    } catch (error) {
      console.error('Invalid JSON body for /api/interview/generate:', error)
      return errorJson('Bad Request', 400, 'invalid_json', 'Invalid JSON body')
    }

    const apiKey = process.env.GEMINI_API_KEY?.trim()
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: 'Missing GEMINI_API_KEY' }, { status: 500 })
    }

    const sessionId = typeof body.sessionId === 'string' ? body.sessionId.trim() : ''
    const selectedRole = typeof body.role === 'string' && body.role.trim() ? body.role.trim() : ''
    const category = typeof body.category === 'string' && body.category.trim() ? body.category.trim() : 'mixed'
    const requestedDifficulty = typeof body.difficulty === 'string' && body.difficulty.trim() ? body.difficulty.trim() : 'medium'
    const sessionType = body.sessionType === 'timed' ? 'timed' : 'full'
    const questionNumber = typeof body.questionNumber === 'number' ? body.questionNumber : 1
    const totalQuestions = typeof body.totalQuestions === 'number' ? body.totalQuestions : 12

    if (!sessionId || !selectedRole) {
      return errorJson('Bad Request', 400, 'missing_required_fields', 'Session ID and role are required')
    }

    const user = await getCurrentUser()

    const adminSupabase = createAdminSupabaseClient()
    const { data: session, error: sessionError } = await adminSupabase
      .from('interview_sessions')
      .select('id, user_id, role, mode, total_questions, difficulty_level, current_question_number')
      .eq('id', sessionId)
      .single()

    if (sessionError || !session) {
      console.error('Interview session not found or inaccessible:', sessionError)
      return errorJson('Not Found', 404, 'session_not_found', 'Interview session not found')
    }

    const categoryOrder = ['hr', 'behavioral', 'technical', 'scenario', 'advanced']
    const orderedCategory = categoryOrder[(Math.max(questionNumber, 1) - 1) % categoryOrder.length]
    const effectiveCategory = category === 'mixed' ? orderedCategory : category
    const difficulty = session.difficulty_level || requestedDifficulty

    let previousQuestions: string[] = []

    let historyRows: Array<{ question: string }> | null = null
    let historyError: unknown = null
    if (user) {
      const supabase = await createServerSupabaseClient()
      const result = await supabase
        .from('interview_question_history')
        .select('question')
        .eq('user_id', user.id)
        .eq('role', selectedRole)
        .order('created_at', { ascending: false })
        .limit(200)
      historyRows = result.data
      historyError = result.error
    }

    if (historyError) {
      console.error('Failed to fetch interview question history:', historyError)
    } else {
      previousQuestions = (historyRows ?? [])
        .map((row) => (typeof row.question === 'string' ? row.question.trim() : ''))
        .filter(Boolean)
    }

    const systemPrompt = [
      `You are an interview question generator.`,
      `Role: ${selectedRole}`,
      `Category: ${effectiveCategory}`,
      `Difficulty: ${difficulty}`,
      `Session Type: ${sessionType}`,
      `Question Number: ${questionNumber}`,
      `Total Questions: ${totalQuestions || session.total_questions}`,
      `Generate a ${difficulty} level ${effectiveCategory} interview question for the role ${selectedRole}.`,
      `Avoid repeating any of the following questions: ${previousQuestions.join(', ') || 'None'}.`,
      `Ensure the question is unique and not semantically similar.`,
      `Return exactly one interview question in plain text.`,
    ].join('\n')

    try {
      const generatedQuestion = await generateWithGemini(systemPrompt, apiKey)
      if (!generatedQuestion) {
        return NextResponse.json({ ok: false, error: 'Gemini request failed' }, { status: 500 })
      }

      if (user) {
        const supabase = await createServerSupabaseClient()
        const { error: insertError } = await supabase
          .from('interview_question_history')
          .insert({
            session_id: sessionId,
            user_id: user.id,
            role: selectedRole,
            category: effectiveCategory,
            difficulty,
            question: generatedQuestion,
            answer: null,
            score: null,
            time_taken: null,
          })
          .select('id')
          .single()

        if (insertError) {
          console.error('Failed to save interview question history:', insertError)
          return errorJson('Failed to save interview question history', 500, 'history_insert_failed')
        }

        const { error: sessionUpdateError } = await adminSupabase.from('interview_sessions').update({
          current_question_number: questionNumber,
        }).eq('id', sessionId)

        if (sessionUpdateError) {
          console.error('Failed to update interview session progress:', sessionUpdateError)
        }

        return NextResponse.json({ ok: true, question: generatedQuestion })
      }

      const { error: sessionUpdateError } = await adminSupabase.from('interview_sessions').update({
        current_question_number: questionNumber,
      }).eq('id', sessionId)

      if (sessionUpdateError) {
        console.error('Failed to update guest interview session progress:', sessionUpdateError)
      }

      return NextResponse.json({ ok: true, question: generatedQuestion })
    } catch (error) {
      console.error('Question generation failed:', error)
      if (error instanceof ApiRouteError) {
        return errorJson(error.message, error.status, error.code, error.details)
      }
      return errorJson('Failed to generate interview question', 500, 'generation_failed', toErrorMessage(error))
    }
  } catch (error) {
    console.error('Unexpected /api/interview/generate error:', error)
    if (error instanceof ApiRouteError) {
      return errorJson(error.message, error.status, error.code, error.details)
    }
    return errorJson('Unexpected server error', 500, 'unexpected_error', toErrorMessage(error))
  }
}

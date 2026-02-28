import { evaluateInterviewAnswer, buildKeywordUsageScore } from '@/lib/ai-utils'
import { getCurrentUser } from '@/lib/auth'
import { createServerSupabaseClient } from '@/lib/supabase-server'

const DIFFICULTY_LEVELS = ['easy', 'medium', 'hard'] as const
type DifficultyLevel = (typeof DIFFICULTY_LEVELS)[number]

function normalizeDifficulty(value: string) {
  const safe = String(value || '').toLowerCase()
  if (safe === 'easy' || safe === 'medium' || safe === 'hard') return safe
  if (safe === 'beginner') return 'easy'
  if (safe === 'intermediate') return 'medium'
  if (safe === 'advanced') return 'hard'
  console.warn('Invalid difficulty level, defaulting to medium:', value)
  return 'medium'
}

function increaseDifficulty(level: string): DifficultyLevel {
  const current = normalizeDifficulty(level) as DifficultyLevel
  const index = DIFFICULTY_LEVELS.indexOf(current)
  if (index < 0) {
    console.warn('Failed to increase difficulty due to invalid level:', level)
    return 'medium'
  }
  return DIFFICULTY_LEVELS[Math.min(DIFFICULTY_LEVELS.length - 1, index + 1)]
}

function decreaseDifficulty(level: string): DifficultyLevel {
  const current = normalizeDifficulty(level) as DifficultyLevel
  const index = DIFFICULTY_LEVELS.indexOf(current)
  if (index < 0) {
    console.warn('Failed to decrease difficulty due to invalid level:', level)
    return 'medium'
  }
  return DIFFICULTY_LEVELS[Math.max(0, index - 1)]
}

function getNextDifficulty(current: string, scoreOutOfTen: number): DifficultyLevel {
  const normalizedCurrent = normalizeDifficulty(current)
  if (scoreOutOfTen >= 8) {
    return increaseDifficulty(normalizedCurrent)
  }

  if (scoreOutOfTen <= 4) {
    return decreaseDifficulty(normalizedCurrent)
  }

  return normalizedCurrent as DifficultyLevel
}

export async function POST(request: Request) {
  try {
    const { question, answer, mode, sessionId, historyId, timeTaken, questionNumber, totalQuestions } = await request.json()

    const { scores, feedback, strengths, weaknesses, improvementTips } = await evaluateInterviewAnswer(
      question,
      answer,
      mode
    )

    const user = await getCurrentUser()
    if (user) {
      const clarity = Number(scores?.clarity ?? scores?.communication ?? 0)
      const technicalDepth = Number(scores?.technicalDepth ?? scores?.technical ?? 0)
      const confidence = Number(scores?.confidence ?? scores?.leadership ?? 0)
      const structure = Number(scores?.structure ?? scores?.problemSolving ?? 0)
      const keywordUsage = Number(scores?.keywordUsage ?? buildKeywordUsageScore(answer, question))
      const overallScore = Math.round(
        (clarity + technicalDepth + confidence + structure + keywordUsage) / 5
      )
      const scoreOutOfTen = Number((overallScore / 10).toFixed(2))

      const supabase = await createServerSupabaseClient()
      await supabase.from('interview_history').insert({
        user_id: user.id,
        mode,
        question_count: 1,
        overall_score: overallScore,
        scores,
        feedback,
      })

      if (historyId && sessionId) {
        const { error: historyUpdateError } = await supabase
          .from('interview_question_history')
          .update({
            answer: typeof answer === 'string' ? answer : '',
            score: scoreOutOfTen,
            time_taken: Number.isFinite(timeTaken) ? Math.max(0, Math.round(timeTaken)) : null,
          })
          .eq('id', historyId)
          .eq('session_id', sessionId)
          .eq('user_id', user.id)

        if (historyUpdateError) {
          console.error('Failed to update interview question history:', historyUpdateError)
        }

        const { data: session, error: sessionFetchError } = await supabase
          .from('interview_sessions')
          .select('difficulty_level, role')
          .eq('id', sessionId)
          .eq('user_id', user.id)
          .single()

        if (sessionFetchError) {
          console.error('Failed to fetch interview session for adaptive difficulty:', sessionFetchError)
        } else {
          const currentDifficulty = normalizeDifficulty(session?.difficulty_level || 'medium')
          const nextDifficulty = getNextDifficulty(currentDifficulty, scoreOutOfTen)
          console.log('Adaptive difficulty adjustment:', {
            sessionId,
            scoreOutOfTen,
            from: currentDifficulty,
            to: nextDifficulty,
          })
          const isCompleted =
            Number.isFinite(questionNumber) &&
            Number.isFinite(totalQuestions) &&
            Number(questionNumber) >= Number(totalQuestions)

          const sessionUpdatePayload: {
            score: number
            difficulty_level: string
            completed_at?: string
          } = {
            score: scoreOutOfTen,
            difficulty_level: nextDifficulty,
          }
          if (isCompleted) {
            sessionUpdatePayload.completed_at = new Date().toISOString()
          }

          const { error: sessionUpdateError } = await supabase
            .from('interview_sessions')
            .update(sessionUpdatePayload)
            .eq('id', sessionId)
            .eq('user_id', user.id)

          if (sessionUpdateError) {
            console.error('Failed to update interview session adaptive state:', sessionUpdateError)
          }

          if (isCompleted) {
            // Interview performance persistence is handled client-side on final completion.
          }
        }
      }
    }

    return Response.json({
      scores,
      feedback,
      strengths,
      weaknesses,
      improvement_tips: improvementTips,
    })
  } catch (error) {
    console.error('Error:', error)
    return Response.json(
      { error: 'Failed to evaluate answer' },
      { status: 500 }
    )
  }
}

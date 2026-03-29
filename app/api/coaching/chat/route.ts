import { streamText } from 'ai'
import { anthropic } from '@ai-sdk/anthropic'
import { groq } from '@ai-sdk/groq'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import { getCurrentUser } from '@/lib/auth'

export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { messages, sessionId, model = 'claude' } = await req.json()

    const supabase = await createServerSupabaseClient()

    // Get user preferences
    const { data: preferences } = await supabase
      .from('coaching_preferences')
      .select('coaching_style, tone')
      .eq('user_id', user.id)
      .single()

    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    const coachingStyle = preferences?.coaching_style || 'supportive'
    const tone = preferences?.tone || 'professional'

    const systemPrompt = `You are an expert career coach with years of experience helping professionals achieve their goals. 
Your role is to provide personalized career guidance, mentorship, and support.

User Profile:
- Name: ${profile?.first_name || 'User'}
- Job Title: ${profile?.job_title || 'Not specified'}
- Industry: ${profile?.industry || 'Not specified'}
- Years of Experience: ${profile?.years_experience || 'Not specified'}

Coaching Style: ${coachingStyle}
Communication Tone: ${tone}

Guidelines:
- Ask clarifying questions to understand the user's goals and challenges
- Provide actionable advice tailored to their career stage and industry
- Be empathetic and supportive while maintaining professionalism
- Help users identify their strengths and areas for development
- Suggest concrete next steps and resources when appropriate
- Remember context from previous conversations`

    // Select AI model
    let selectedModel
    if (model === 'groq') {
      selectedModel = groq('mixtral-8x7b-32768')
    } else {
      selectedModel = anthropic('claude-3-5-sonnet-20241022')
    }

    const result = streamText({
      model: selectedModel,
      system: systemPrompt,
      messages: messages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      })),
    })

    // Store message in database
    if (sessionId) {
      const userMessage = messages[messages.length - 1]
      await supabase.from('session_messages').insert({
        session_id: sessionId,
        user_id: user.id,
        message_text: userMessage.content,
        message_type: 'user',
      })
    }

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('Coaching chat error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

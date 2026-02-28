import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({
        interview_sessions: 0,
        skill_lens: 0,
      })
    }

    const { data, error } = await supabase
      .from('user_usage')
      .select('interview_sessions, skill_lens')
      .eq('user_id', user.id)
      .single()

    if (error || !data) {
      return NextResponse.json({
        interview_sessions: 0,
        skill_lens: 0,
      })
    }

    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({
      interview_sessions: 0,
      skill_lens: 0,
    })
  }
}

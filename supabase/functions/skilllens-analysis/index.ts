import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

const VALID_EXPERIENCE = ["Beginner", "Intermediate", "Advanced"]

type SkillLensResponse = {
  summary: string
  skillGaps: string[]
  roadmap: {
    shortTerm: string[]
    midTerm: string[]
    longTerm: string[]
  }
  projects: string[]
  courses: {
    free: {
      title: string
      platform: string
      url: string
    }[]
    paid: {
      title: string
      platform: string
      url: string
    }[]
  }
  certifications: string[]
  higherStudies: string[]
}

type GeminiGenerateResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string
      }>
    }
  }>
}

function normalizeSkills(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean)
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean)
  }

  return []
}

function stripCodeFence(raw: string): string {
  const trimmed = raw.trim()
  if (!trimmed.startsWith("```")) return trimmed
  return trimmed
    .replace(/^```[a-zA-Z]*\n?/, "")
    .replace(/\n?```$/, "")
    .trim()
}

function isSkillLensResponse(payload: unknown): payload is SkillLensResponse {
  if (!payload || typeof payload !== "object") return false
  const data = payload as SkillLensResponse

  const isStringArray = (value: unknown): value is string[] =>
    Array.isArray(value) && value.every((item) => typeof item === "string")

  const isCourseList = (
    value: unknown
  ): value is { title: string; platform: string; url: string }[] =>
    Array.isArray(value)
    && value.every((item) =>
      item
      && typeof item === "object"
      && typeof (item as { title: string }).title === "string"
      && typeof (item as { platform: string }).platform === "string"
      && typeof (item as { url: string }).url === "string")

  return (
    typeof data.summary === "string"
    && isStringArray(data.skillGaps)
    && !!data.roadmap
    && isStringArray(data.roadmap.shortTerm)
    && isStringArray(data.roadmap.midTerm)
    && isStringArray(data.roadmap.longTerm)
    && isStringArray(data.projects)
    && !!data.courses
    && isCourseList(data.courses.free)
    && isCourseList(data.courses.paid)
    && isStringArray(data.certifications)
    && isStringArray(data.higherStudies)
  )
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const body = await req.json()

    const currentRole =
      typeof body?.currentRole === "string" ? body.currentRole.trim() : ""
    const targetRole =
      typeof body?.targetRole === "string" ? body.targetRole.trim() : ""
    const currentSkills = normalizeSkills(body?.currentSkills)
    const experienceLevel =
      typeof body?.experienceLevel === "string" ? body.experienceLevel.trim() : ""

    if (!currentRole || currentRole.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: "Invalid current role" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    if (!targetRole || targetRole.trim().length < 3) {
      return new Response(
        JSON.stringify({ error: "Invalid target role" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    if (!VALID_EXPERIENCE.includes(experienceLevel)) {
      return new Response(
        JSON.stringify({ error: "Invalid experience level" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    if (currentSkills.length === 0) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: currentSkills" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    const geminiApiKey = Deno.env.get("GEMINI_API_KEY")
    if (!geminiApiKey) {
      return new Response(
        JSON.stringify({ error: "Missing GEMINI_API_KEY secret" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    const prompt = `You are a professional career roadmap advisor.

User Details:
Current Role: ${currentRole}
Target Role: ${targetRole}
Current Skills: ${currentSkills.join(", ")}
Experience Level: ${experienceLevel}

Generate a structured career roadmap.

Return ONLY valid JSON in this exact format:
{
  "summary": "string",
  "skillGaps": ["string"],
  "roadmap": {
    "shortTerm": ["string"],
    "midTerm": ["string"],
    "longTerm": ["string"]
  },
  "projects": ["string"],
  "courses": {
    "free": [
      {
        "title": "string",
        "platform": "string",
        "url": "string"
      }
    ],
    "paid": [
      {
        "title": "string",
        "platform": "string",
        "url": "string"
      }
    ]
  },
  "certifications": ["string"],
  "higherStudies": ["string"]
}

Ensure:
- No markdown
- No extra text
- Strict JSON format matching SkillLensResponse
- Real course names
- Real platforms (Coursera, Udemy, freeCodeCamp, Google UX Certificate, etc.)
- Working URLs
- Balanced free and paid options
- Practical project ideas
- Timeline-based roadmap`

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
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

    if (!geminiResponse.ok) {
      return new Response(
        JSON.stringify({ error: "Gemini request failed" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    const geminiPayload = (await geminiResponse.json()) as GeminiGenerateResponse
    const rawText =
      geminiPayload.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? ""

    if (!rawText) {
      return new Response(
        JSON.stringify({ error: "Gemini returned an empty response" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(stripCodeFence(rawText))
    } catch (_error) {
      return new Response(
        JSON.stringify({ error: "Gemini returned invalid JSON" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    if (!isSkillLensResponse(parsed)) {
      return new Response(
        JSON.stringify({ error: "Gemini JSON did not match required structure" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      )
    }

    return new Response(JSON.stringify(parsed), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (_error) {
    return new Response(
      JSON.stringify({ error: "Unexpected server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    )
  }
})

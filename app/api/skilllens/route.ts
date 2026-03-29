import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "moonshotai/kimi-k2-instruct-0905",
        messages: [
          {
            role: "user",
            content: `
You are an AI career coach.

Return ONLY valid JSON. No explanation.

Format:
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
      { "title": "string", "platform": "string", "url": "string" }
    ],
    "paid": [
      { "title": "string", "platform": "string", "url": "string" }
    ]
  },
  "certifications": ["string"],
  "higherStudies": ["string"]
}

Analyze:

Current Role: ${body.currentRole}
Target Role: ${body.targetRole}
Skills: ${body.skills}
Experience: ${body.experience}
            `,
          },
        ],
      }),
    });

    const data = await response.json();
    const text = data?.choices?.[0]?.message?.content;

    if (!text) {
        console.log("FULL GROQ RESPONSE:", data); // 👈 VERY IMPORTANT
        return NextResponse.json(
          { error: "No response from AI", raw: data },
          { status: 500 }
        );
      }
      
      let cleaned = text.trim();

// remove ```json or ``` if present
cleaned = cleaned.replace(/```json/g, "").replace(/```/g, "");

// extract JSON part only
const start = cleaned.indexOf("{");
const end = cleaned.lastIndexOf("}");

if (start !== -1 && end !== -1) {
  cleaned = cleaned.substring(start, end + 1);
}

let parsed;

try {
  parsed = JSON.parse(cleaned);
} catch (err) {
  console.log("RAW AI RESPONSE:", text);
  return NextResponse.json(
    { error: "Invalid JSON from AI", raw: text },
    { status: 500 }
  );
}

    return NextResponse.json(parsed);
} catch (error) {
    console.error("FULL ERROR:", error); // 👈 ADD THIS
    return NextResponse.json({ error: "API failed" }, { status: 500 });
  }
}
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "@supabase/supabase-js"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get("Authorization")

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SERVICE_ROLE_KEY")!
    )

    let isAuthenticated = false

    // Only try validating token if it looks valid
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "")

      if (token && token !== "null") {
        const { data } = await supabase.auth.getUser(token)
        if (data?.user) {
          isAuthenticated = true
        }
      }
    }

    const body = await req.json()
    const { role, type } = body

    if (!role || !type) {
      return new Response(
        JSON.stringify({ error: "Missing role or type" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const questions = [
      `Tell me about yourself as a ${role}.`,
      `Describe a challenging situation you faced as a ${role}.`,
      `How do you approach problem solving in a ${role} role?`,
      `What tools do you use most as a ${role}?`,
      `Why should we hire you for this ${role} position?`
    ]

    return new Response(
      JSON.stringify({
        success: true,
        message: `Interview started for ${role} (${type})`,
        questions,
        guest: !isAuthenticated,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: "Unexpected server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})

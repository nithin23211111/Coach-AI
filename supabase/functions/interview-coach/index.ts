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
    let body: Record<string, unknown> = {}
    try {
      body = await req.json()
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid or missing JSON body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const role = typeof body.role === "string" ? body.role.trim() : ""
    const type = typeof body.type === "string" ? body.type.trim() : "standard"
    console.log("Role received:", role)

    if (!role) {
      return new Response(
        JSON.stringify({ error: "Role is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      )
    }

    const authHeader = req.headers.get("Authorization")
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
    let isAuthenticated = false

    if (!supabaseUrl || !serviceRoleKey) {
      console.error(
        "Edge function error:",
        "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variable"
      )
    } else {
      const supabase = createClient(supabaseUrl, serviceRoleKey)

      // Only try validating token if it looks valid
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.replace("Bearer ", "")

        if (token && token !== "null") {
          const { data, error } = await supabase.auth.getUser(token)
          if (error) {
            console.error("Edge function error:", error)
          }
          if (data?.user) {
            isAuthenticated = true
          }
        }
      }
    }

    console.log("Generating interview questions")
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
    console.error("Edge function error:", error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unexpected server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    )
  }
})

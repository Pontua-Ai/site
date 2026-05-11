import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    })
  }

  try {
    const { token } = await req.json()

    if (!token) {
      return new Response(JSON.stringify({ error: "token é obrigatório" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const { data, error } = await supabase
      .from("users")
      .update({ confirmado: true, token_confirmacao: null })
      .eq("token_confirmacao", token)
      .select()
      .single()

    if (error || !data) {
      return new Response(JSON.stringify({ error: "Token inválido ou conta já confirmada" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    return new Response(JSON.stringify({ success: true, email: data.email }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
})

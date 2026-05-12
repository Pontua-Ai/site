import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import nodemailer from "npm:nodemailer@6.9.16"

const SMTP_HOST = Deno.env.get("SMTP_HOST") || "smtp.gmail.com"
const SMTP_PORT = parseInt(Deno.env.get("SMTP_PORT") || "587")
const SMTP_USER = Deno.env.get("SMTP_USER") || ""
const SMTP_PASS = Deno.env.get("SMTP_PASS") || ""
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || SMTP_USER
const SITE_URL = Deno.env.get("SITE_URL") || "https://pontua-ai.github.io/site"

const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
})

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders })
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Método não permitido" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }

  try {
    const { email, site_url } = await req.json()

    if (!email) {
      return new Response(JSON.stringify({ error: "email é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    )

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id_usuario, username, email")
      .eq("email", email)
      .single()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Email não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const token = crypto.randomUUID()

    const { error: updateError } = await supabase
      .from("users")
      .update({ token_recuperacao: token })
      .eq("id_usuario", user.id_usuario)

    if (updateError) {
      return new Response(JSON.stringify({ error: updateError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const baseUrl = (site_url || SITE_URL).replace(/\/+$/, "")
    const resetLink = `${baseUrl}/redefinir-senha?token=${encodeURIComponent(token)}`

    await transporter.sendMail({
      from: FROM_EMAIL,
      to: email,
      subject: "Recuperação de senha - Pontua Aí!",
      text: `Olá, ${user.username}!\n\nRecebemos uma solicitação de recuperação de senha para sua conta no Pontua Aí.\n\nPara redefinir sua senha, clique no link abaixo:\n${resetLink}\n\nSe você não solicitou esta recuperação, ignore este email.\n\nEquipe Pontua Aí`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; text-align: center;">
          <h2 style="color: #0B9395;">Recuperação de senha 🔐</h2>
          <p>Olá, <strong>${user.username}</strong>!</p>
          <p>Recebemos uma solicitação de recuperação de senha para sua conta.</p>
          <p>Clique no botão abaixo para redefinir sua senha:</p>
          <br>
          <a href="${resetLink}" style="background-color: #0B9395; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">
            Redefinir senha
          </a>
          <br><br>
          <p style="color: #888; font-size: 12px;">Se você não solicitou esta recuperação, ignore este email.</p>
          <br>
          <p><strong>Equipe Pontua Aí</strong></p>
        </div>
      `,
    })

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    })
  }
})

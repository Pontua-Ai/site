import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts"

const client = new SmtpClient()

const SMTP_HOST = Deno.env.get("SMTP_HOST") || "smtp.gmail.com"
const SMTP_PORT = parseInt(Deno.env.get("SMTP_PORT") || "587")
const SMTP_USER = Deno.env.get("SMTP_USER") || ""
const SMTP_PASS = Deno.env.get("SMTP_PASS") || ""
const FROM_EMAIL = Deno.env.get("FROM_EMAIL") || SMTP_USER
const SITE_URL = Deno.env.get("SITE_URL") || "https://pontua-ai.github.io/site"

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
    const { email, username, token, tipo_conta } = await req.json()

    if (!email || !username || !token) {
      return new Response(JSON.stringify({ error: "email, username e token são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      })
    }

    const confirmLink = `${SITE_URL.replace(/\/+$/, "")}/confirmar.html?token=${encodeURIComponent(token)}`

    await client.connectTLS({
      hostname: SMTP_HOST,
      port: SMTP_PORT,
      username: SMTP_USER,
      password: SMTP_PASS,
    })

    await client.send({
      from: FROM_EMAIL,
      to: email,
      subject: "Confirme seu cadastro no Pontua Aí!",
      content: `Olá, ${username}!\n\nObrigado por se cadastrar no Pontua Aí!\n\nPara ativar sua conta, clique no link abaixo:\n${confirmLink}\n\nSe você não se cadastrou, ignore este email.\n\nEquipe Pontua Aí`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; text-align: center;">
          <h2 style="color: #4CAF50;">Bem-vindo ao Pontua Aí! 🐨</h2>
          <p>Olá, <strong>${username}</strong>!</p>
          <p>Obrigado por se cadastrar! Para ativar sua conta, clique no botão abaixo:</p>
          <br>
          <a href="${confirmLink}" style="background-color: #4CAF50; color: white; padding: 14px 28px; text-decoration: none; border-radius: 5px; font-size: 16px; display: inline-block;">
            Confirmar cadastro
          </a>
          <br><br>
          <p style="color: #888; font-size: 12px;">Se você não se cadastrou no Pontua Aí, ignore este email.</p>
          <br>
          <p><strong>Equipe Pontua Aí</strong></p>
        </div>
      `,
    })

    await client.close()

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

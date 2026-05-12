import supabaseClient from "./supabase.js";
import { config } from "./config.js";

export function validarSenha(senha) {
    const erros = [];
    if (senha.length < 8) erros.push("pelo menos 8 caracteres");
    if (!/[A-Z]/.test(senha)) erros.push("Pelo menos 1 letra maiúscula");
    if (!/[a-z]/.test(senha)) erros.push("Pelo menos 1 letra minúscula");
    if (!/[0-9]/.test(senha)) erros.push("Pelo menos 1 número");
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha)) erros.push("Pelo menos 1 caractere especial");
    return erros;
}

async function hashSenha(senha) {
    const encoder = new TextEncoder();
    const data = encoder.encode(senha);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function signup(username, email, senha) {
    const { data: existingUser } = await supabaseClient
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

    if (existingUser) {
        return { success: false, error: "Email já cadastrado" };
    }

    const dominio = email.split('@')[1];
    if (dominio !== 'cps.sp.gov.br' && dominio !== 'aluno.cps.sp.gov.br') {
        return { success: false, error: "Apenas emails institucionais (@cps.sp.gov.br ou @aluno.cps.sp.gov.br) são permitidos." };
    }

    const tipoConta = dominio === 'aluno.cps.sp.gov.br' ? 'aluno' : 'professor';
    const senhaHash = await hashSenha(senha);
    const token = crypto.randomUUID();

    const { data, error } = await supabaseClient
        .from("users")
        .insert([{
            email: email,
            senha: senhaHash,
            username: username,
            tipo_conta: tipoConta,
            token_confirmacao: token,
            confirmado: false
        }]);

    if (error) {
        return { success: false, error: error.message };
    }

    try {
        const functionUrl = config.SUPABASE_URL.replace(/\/+$/, "") + "/functions/v1/send-confirmation";
        const response = await fetch(functionUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "apikey": config.SUPABASE_KEY,
            },
            body: JSON.stringify({ email, username, token, tipo_conta: tipoConta, site_url: window.location.origin + window.location.pathname.replace(/\/[^/]*$/, "") }),
        });
        const data = await response.json();
        if (!data.success) {
            console.error("Edge Function retornou erro:", data.error);
        } else {
            console.log("Email de confirmação enviado com sucesso");
        }
    } catch (e) {
        console.error("Erro ao chamar Edge Function:", e);
    }

    return { success: true, tipo_conta: tipoConta };
}


export async function loginUsuario(login, senha) {
    const { data, error } = await supabaseClient
        .from("users")
        .select("*")
        .or(`email.eq.${login},username.eq.${login}`)
        .single();
    if (error || !data) {
        return { success: false, error: "Usuário não encontrado" };
    }
    if (!data.confirmado) {
        return { success: false, error: "Confirme seu email antes de fazer login. Verifique sua caixa de entrada." };
    }
    const hashInput = await hashSenha(senha);
    if (data.senha !== hashInput) {
        return { success: false, error: "Senha incorreta" };
    }
    console.log("Usuario logado:", data);
    return { success: true, user: data };
}

export async function verificarSenha(email, senha) {
    const hashInput = await hashSenha(senha);
    const { data, error } = await supabaseClient
        .from("users")
        .select("senha")
        .eq("email", email)
        .single();

    if (error || !data) {
        return { success: false, error: "Usuário não encontrado" };
    }

    if (data.senha !== hashInput) {
        return { success: false, error: "Senha incorreta" };
    }

    return { success: true };
}

export async function excluirConta(idUsuario) {
    const { error } = await supabaseClient
        .from("users")
        .delete()
        .eq("id_usuario", idUsuario);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

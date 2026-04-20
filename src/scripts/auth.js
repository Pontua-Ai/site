import supabaseClient from "./supabase.js";

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

    const { data, error } = await supabaseClient
        .from("users")
        .insert([{ email: email, senha: senhaHash, username: username, tipo_conta: tipoConta }]);

    if (error) {
        return { success: false, error: error.message };
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
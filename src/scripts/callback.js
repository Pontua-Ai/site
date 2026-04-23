import supabaseClient from "./supabase.js";

const mensagem = document.getElementById("mensagem");

async function handleCallback() {
    const hashParams = window.location.hash.substring(1);
    const searchParams = new URLSearchParams(hashParams);
    
    if (searchParams.get("access_token")) {
        window.location.hash = searchParams.toString();
    }
    
    const { data: { session }, error } = await supabaseClient.auth.getSession();

    if (error) {
        mensagem.textContent = "Erro ao confirmar e-mail. Tente novamente.";
        setTimeout(() => {
            window.location.href = "inicio.html";
        }, 3000);
        return;
    }

    if (session) {
        mensagem.textContent = "E-mail confirmado com sucesso!";
        setTimeout(() => {
            window.location.href = "inicio.html";
        }, 1500);
    } else {
        mensagem.textContent = "E-mail confirmado! Faça login para continuar.";
        setTimeout(() => {
            window.location.href = "inicio.html";
        }, 3000);
    }
}

handleCallback();
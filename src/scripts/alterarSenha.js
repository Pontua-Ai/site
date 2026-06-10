import { initTheme } from "./theme.js";
import supabaseClient from "./supabase.js";
import { validarSenha, verificarSenha } from "./auth.js";
import { toast } from "./utils.js";

initTheme();

const userLogado = JSON.parse(localStorage.getItem("userLogado"));

if (!userLogado) {
    window.location.href = "inicio.html";
}

const voltarLink = document.querySelector(".ajuda a");
if (voltarLink && userLogado) {
    voltarLink.href = userLogado.tipo_conta === "professor" ? "conta_prof.html" : "conta_aluno.html";
}

async function hashSenha(senha) {
    const encoder = new TextEncoder();
    const data = encoder.encode(senha);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

document.getElementById("alterarSenhaForm").addEventListener("submit", async (e) => {
    e.preventDefault();

    const alerta = document.getElementById("alerta");
    const senhaAtual = document.getElementById("senhaAtual").value;
    const novaSenha = document.getElementById("novaSenha").value;
    const confirmarSenha = document.getElementById("confirmarNovaSenha").value;

    alerta.style.display = "none";

    if (!senhaAtual || !novaSenha || !confirmarSenha) {
        alerta.textContent = "Preencha todos os campos";
        alerta.style.backgroundColor = "#f8d7da";
        alerta.style.color = "#721c24";
        alerta.style.border = "1px solid #f5c6cb";
        alerta.style.display = "block";
        return;
    }

    if (novaSenha !== confirmarSenha) {
        alerta.textContent = "As senhas não conferem";
        alerta.style.backgroundColor = "#f8d7da";
        alerta.style.color = "#721c24";
        alerta.style.border = "1px solid #f5c6cb";
        alerta.style.display = "block";
        return;
    }

    const erros = validarSenha(novaSenha);
    if (erros.length > 0) {
        alerta.textContent = "A senha deve ter: " + erros.join(", ");
        alerta.style.backgroundColor = "#f8d7da";
        alerta.style.color = "#721c24";
        alerta.style.border = "1px solid #f5c6cb";
        alerta.style.display = "block";
        return;
    }

    const resultado = await verificarSenha(userLogado.email, senhaAtual);
    if (!resultado.success) {
        alerta.textContent = "Senha atual incorreta";
        alerta.style.backgroundColor = "#f8d7da";
        alerta.style.color = "#721c24";
        alerta.style.border = "1px solid #f5c6cb";
        alerta.style.display = "block";
        return;
    }

    const novaHash = await hashSenha(novaSenha);
    const { error } = await supabaseClient
        .from("users")
        .update({ senha: novaHash })
        .eq("id_usuario", userLogado.id_usuario);

    if (error) {
        alerta.textContent = "Erro ao alterar senha. Tente novamente.";
        alerta.style.backgroundColor = "#f8d7da";
        alerta.style.color = "#721c24";
        alerta.style.border = "1px solid #f5c6cb";
        alerta.style.display = "block";
        return;
    }

    localStorage.removeItem("userLogado");
    toast("Senha alterada com sucesso! Faça login novamente.", "success");
    setTimeout(() => {
        window.location.href = "inicio.html";
    }, 1500);
});

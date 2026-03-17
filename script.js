async function hashSenha(senha) {
    const encoder = new TextEncoder();
    const data = encoder.encode(senha);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

async function loginUsuario(login, senha) {
    const { data, error } = await supabaseClient
        .from("users")
        .select("*")
        .or(`email.eq.${login},username.eq.${login}`)
        .single();
    if (error || !data) {
        alert("Usuário não encontrado");
        return;
    }
    const hashInput = await hashSenha(senha);
    if (data.senha !== hashInput) {
        alert("Senha incorreta");
        return;
    }
    alert("Login realizado com sucesso!");
    
    if (data.tipo === "professor") {
        window.location.href = "inicio_professor.html";
    } else {
        window.location.href = "inicio_aluno.html";
    }
}

function validarSenha(senha, username, email) {
    const erros = [];

    if (!/[A-Z]/.test(senha)) {
        erros.push("- Precisa ter pelo menos uma letra maiúscula");
    }
    if (!/[a-z]/.test(senha)) {
        erros.push("- Precisa ter pelo menos uma letra minúscula");
    }
    if (!/[0-9]/.test(senha)) {
        erros.push("- Precisa ter pelo menos um número");
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(senha)) {
        erros.push("- Precisa ter pelo menos um caractere especial");
    }

    const usernameLower = username.toLowerCase();
    const senhaLower = senha.toLowerCase();
    if (senhaLower.includes(usernameLower)) {
        erros.push("- Não pode conter o nome de usuário");
    }

    const emailPart = email.split("@")[0].toLowerCase();
    if (senhaLower.includes(emailPart)) {
        erros.push("- Não pode ter semelhança com o email");
    }

    if (/(.)\1{2,}/.test(senha)) {
        erros.push("- Não pode ter caracteres repetidos em sequência");
    }

    const sequencias = ["012", "123", "234", "345", "456", "567", "678", "789", "890"];
    for (let seq of sequencias) {
        if (senha.includes(seq)) {
            erros.push("- Não pode ter números em sequência");
            break;
        }
    }

    if (erros.length > 0) {
        alert("Senha inválida:\n" + erros.join("\n"));
        return false;
    }
    return true;
}

function validarEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        alert("Email inválido! Por favor, insira um email no formato correto (exemplo@dominio.com)");
        return false;
    }
    return true;
}

async function cadastrarUsuario(email, senha, tipo, username) {
    if (!validarEmail(email)) {
        return;
    }
    if (!validarSenha(senha, username, email)) {
        return;
    }
    const { data: existingUser } = await supabaseClient
        .from("users")
        .select("*")
        .eq("email", email)
        .single();

    if (existingUser) {
        alert("Email já cadastrado");
        return;
    }

    const { data: existingUsername } = await supabaseClient
        .from("users")
        .select("*")
        .eq("username", username)
        .single();

    if (existingUsername) {
        alert("Nome de usuário já está em uso");
        return;
    }

    const senhaHash = await hashSenha(senha);

    const { data, error } = await supabaseClient
        .from("users")
        .insert([{ email: email, senha: senhaHash, tipo: tipo, username: username }]);

    if (error) {
        alert("Erro ao cadastrar: " + error.message);
        return;
    }
    alert("Cadastro realizado com sucesso!");
    window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", () => {
    const btnLogin = document.getElementById("btnLogin");
    if (btnLogin) {
        btnLogin.addEventListener("click", () => {
            const login = document.getElementById("email").value;
            const senha = document.getElementById("senha").value;
            loginUsuario(login, senha);
        });
    }

    const btnCadastrar = document.getElementById("btnCadastrar");
    if (btnCadastrar) {
        btnCadastrar.addEventListener("click", () => {
            const email = document.getElementById("email").value;
            const username = document.getElementById("username").value;
            const senha = document.getElementById("senha").value;
            const tipo = document.getElementById("tipo").value;
            cadastrarUsuario(email, senha, tipo, username);
        });
    }
});
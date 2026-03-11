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

    if (data.senha !== senha) {
        alert("Senha incorreta");
        return;
    }

    alert("Login realizado com sucesso!");

    console.log("Usuário logado:", data);
}

document.getElementById("btnLogin").addEventListener("click", () => {

    const login = document.getElementById("email").value;
    const senha = document.getElementById("senha").value;

    loginUsuario(login, senha);

});
import { signup } from "./auth.js";

document.getElementById("signupForm").addEventListener("submit", async (event) => { 
    event.preventDefault();

    const name = document.getElementById("username").value;
    const email = document.getElementById("email").value;
    const password = document.getElementById("senha").value;

    const result = await signup(name, email, password);

    if (result && result.success) {
        alert("Cadastro realizado com sucesso!");
        window.location.href = "inicio.html";
    } else {
        alert("Erro ao realizar cadastro: " + (result?.error || "Erro desconhecido"));
    }
});
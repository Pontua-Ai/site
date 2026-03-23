import { signup, loginUsuario } from "./auth.js";

document.addEventListener("DOMContentLoaded", () => {
    const signupForm = document.getElementById("signupForm");
    if (signupForm) {
        signupForm.addEventListener("submit", async (event) => { 
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
    }

    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const login = document.getElementById("loginEmail").value;
            const password = document.getElementById("loginPassword").value;
            const result = await loginUsuario(login, password);

            if (result && result.success) {
                window.location.href = "sobre.html";
            } else {
                alert("Erro ao realizar login: " + (result?.error || "Erro desconhecido"));
            }
        });
    }
});
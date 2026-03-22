import { signup, login } from "./auth.js";

document.getElementById("signupForm").addEventListener("submit", async (event) => { 
    event.preventDefault();

    const name = document.getElementById("signupName").value;
    const email = document.getElementById("signupEmail").value;
    const password = document.getElementById("signupPassword").value;
    const confirmPassword = document.getElementById("signupConfirmPassword").value;

    const result = await signup(email, password, name, confirmPassword);

    if (result.success) {
        window.location.href = "./inicio.html";
    } else {
        alert("Erro ao realizar cadastro: " + result.error);
    }
});

document.getElementById("loginForm").addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("loginEmail").value;
    const password = document.getElementById("loginPassword").value;

    const result = await login(email, password);
    if (result.success) {
        window.location.href = "sobre.html";
    }
    else {
        alert("Erro ao realizar login: " + result.error);
    }
});
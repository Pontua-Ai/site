import { signup, loginUsuario } from "./auth.js";
import supabaseClient from "./supabase.js";
import { carregarConteudo } from './buscarConteudo.js';
import { carregarMaterias, carregarConteudos } from "./genereAsk.js";


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
            const loginInput = document.getElementById("loginEmail");
            const passwordInput = document.getElementById("loginPassword");

            if (!loginInput || !passwordInput) return;

            const result = await loginUsuario(loginInput.value, passwordInput.value);

            if (result && result.success) {
                window.location.href = "sobre.html";
            } else {
                alert("Erro ao realizar login: " + (result?.error || "Erro desconhecido"));
            }
        });
    }

    const materiaMap = {
        matematica: "Matemática",
        portugues: "Português",
        fisica: "Física",
        quimica: "Química",
        biologia: "Biologia",
        historia: "História",
        geografia: "Geografia",
        ingles: "Inglês",
        artes: "Artes",
        espanhol: "Espanhol",
        filosofia: "Filosofia",
        sociologia: "Sociologia"
    };

    document.querySelectorAll('.subjects-button').forEach(btn => {
        btn.addEventListener('click', () => {
            const nomeMateria = materiaMap[btn.id] || btn.id;
            window.location.href = `conteudo.html?nome_conteudo=${encodeURIComponent(nomeMateria)}`;
        });
    });

    const formPergunta = document.getElementById("formPergunta");
    if (formPergunta) {
        formPergunta.addEventListener("submit", async function (notReaload) {
            notReaload.preventDefault();
            const idMateria = document.getElementById("materia").value;
            const idConteudo = document.getElementById("conteudo").value;
            const pergunta = document.getElementById("pergunta").value;

            if (!idConteudo || !pergunta || !idMateria) {
                alert("SELECIONA A PORRA DO CONTEUDO OU DA PERGUNTA KRL");
                return;
            }

            console.log("idMateria:", idMateria, "idConteudo:", idConteudo);

            
            const alternativas = document.querySelectorAll('.textAlternativa');
            const alternativasValores = Array.from(alternativas).map(input => input.value);

            const correta = document.querySelector('input[name="alternativa"]:checked')?.value;
            
            if (!correta) {
                alert("Selecione a alternativa correta!");
                return;
            }

            if (alternativasValores.some(a => a.trim() === "")) {
                alert("Preencha todas as alternativas!");
                return;
            }

            try {
                const { data: perguntaCriada } = await supabaseClient
                    .from("perguntas")
                    .insert([
                        {
                            pergunta_texto: pergunta,
                            id_conteudo: idConteudo,
                            id_materia: idMateria
                        }
                    ])
                    .select();

                if (!perguntaCriada || perguntaCriada.length === 0) {
                    alert("Erro ao criar pergunta" + (result?.error || "Erro desconhecido"));
                    return;
                }

                const idPergunta = perguntaCriada[0].id;

                for (let i = 0; i < alternativasValores.length; i++) {
                    await supabaseClient
                        .from("alternativa")
                        .insert([
                            {
                                nome_alternativa: alternativasValores[i],
                                id_pergunta: idPergunta,
                                correta: (i + 1).toString() === correta
                            }
                        ]);
                }

                alert("Pergunta cadastrada");
            } catch (erro) {
                console.error(erro);
                alert("Erro ao cadastrar pergunta");
            }
            document.getElementById("pergunta").value = "";
            document.getElementById("alt1").value = "";
            document.getElementById("alt2").value = "";
            document.getElementById("alt3").value = "";
            document.getElementById("alt4").value = "";
            document.getElementById("alt5").value = "";
            document.getElementById("conteudo").value = "";
            document.getElementById("materia").value = "";
        });
    }
});
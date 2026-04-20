import { signup, loginUsuario } from "./auth.js";
import supabaseClient from "./supabase.js";
import { carregarConteudo } from './buscarConteudo.js';
import { carregarMaterias, carregarConteudos } from "./genereAsk.js";
import { carregarPerguntas, exibirPergunta, verificarResposta } from "./exibePergunta.js";
import { toast } from "./utils.js";
import { initTheme, toggleTheme } from "./theme.js";
import { initDadosConta } from "./conta.js";

let quillEditor = null;

initTheme();
initDadosConta();
window.toggleTheme = toggleTheme;

window.logout = function() {
    localStorage.removeItem("userLogado");
    window.location.href = "inicio.html";
};

document.addEventListener("DOMContentLoaded", () => {
    const btnTheme = document.getElementById("btn-theme");
    if (btnTheme) btnTheme.onclick = toggleTheme;
    
    const btnLogout = document.getElementById("btn-logout");
    if (btnLogout) btnLogout.onclick = logout;
    
    const editorContainer = document.getElementById("editor-container");
    if (editorContainer) {
        quillEditor = new Quill("#editor-container", {
            theme: "snow",
            placeholder: "Digite a pergunta...",
            modules: {
                toolbar: [
                    ["bold", "italic", "underline"],
                    [{ "header": [1, 2, 3, false] }],
                    [{ "list": "ordered"}, { "list": "bullet" }],
                    ["image"]
                ]
            }
        });
    } /* Cria o Quill.js para criar as opções de formatação de texto da pergunta*/
    
    const signupForm = document.getElementById("signupForm");
    if (signupForm) {
        signupForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const name = document.getElementById("username").value;
            const email = document.getElementById("email").value;
            const password = document.getElementById("senha").value;

            const result = await signup(name, email, password);

            if (result && result.success) {
                toast("Cadastro realizado com sucesso! Faça login para continuar.", "success");
                window.location.href = "inicio.html";
            } else {
                toast("Erro ao realizar cadastro: " + (result?.error || "Erro desconhecido"), "error");
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
                localStorage.setItem("userLogado", JSON.stringify(result.user));
                
                const tipoConta = result.user.tipo_conta;
                if (tipoConta === 'professor') {
                    window.location.href = "doc_prof.html";
                } else {
                    window.location.href = "materias.html";
                }
            } else {
                toast("Erro ao realizar login: " + (result?.error || "Erro desconhecido"), "error");
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

    document.querySelectorAll('.card[data-materia]').forEach(card => {
        card.addEventListener('click', (e) => {
            e.preventDefault();
            const materia = card.dataset.materia;
            if (!materiaMap[materia]) return;
            const nomeMateria = materiaMap[materia];
            window.location.href = `conteudo.html?nome_conteudo=${encodeURIComponent(nomeMateria)}`;
        });
    });

    const formPergunta = document.getElementById("formPergunta");
    if (formPergunta) {
        formPergunta.addEventListener("submit", async function (notReaload) {
            notReaload.preventDefault();
            const idMateria = document.getElementById("materia").value;
            const idConteudo = document.getElementById("conteudo").value;
            const pergunta = quillEditor ? quillEditor.root.innerHTML : document.getElementById("pergunta").value;

            if (!idConteudo || !pergunta || !idMateria) {
                toast("Selecione o conteúdo e a pergunta!", "error");
                return;
            }

            console.log("idMateria:", idMateria, "idConteudo:", idConteudo);

            
            const alternativas = document.querySelectorAll('.textAlternativa');
            const alternativasValores = Array.from(alternativas).map(input => input.value);

            const correta = document.querySelector('input[name="alternativa"]:checked')?.value;
            
            if (!correta) {
                toast("Selecione a alternativa correta!", "error");
                return;
            }

            if (alternativasValores.some(a => a.trim() === "")) {
                toast("Preencha todas as alternativas!", "error");
                return;
            }

            try {
                const { data: perguntaCriada, error: erroPergunta } = await supabaseClient
                    .from("perguntas")
                    .insert([
                        {
                            pergunta_texto: pergunta,
                            id_conteudo: idConteudo,
                            id_materia: idMateria
                        }
                    ])
                    .select();

                console.log("perguntaCriada:", perguntaCriada, "erro:", erroPergunta);

                if (!perguntaCriada || perguntaCriada.length === 0) {
                    toast("Erro ao criar pergunta: " + (erroPergunta?.message || "Erro desconhecido"), "error");
                    return;
                }

                const idPergunta = perguntaCriada[0].id_pergunta || perguntaCriada[0].id;
                console.log("ID da pergunta criada:", idPergunta);

                for (let i = 0; i < alternativasValores.length; i++) {
                    const { data, error } = await supabaseClient
                        .from("alternativa")
                        .insert([
                            {
                                nome_alternativa: alternativasValores[i],
                                id_pergunta: idPergunta,
                                correta: (i + 1).toString() === correta
                            }
                        ]);
                    console.log("Alternativa inserida:", alternativasValores[i], "Erro:", error);
                }

                toast("Pergunta cadastrada com sucesso!", "success");
            } catch (erro) {
                console.error(erro);
                toast("Erro ao cadastrar pergunta", "error");
            }
            if (quillEditor) {
                quillEditor.setContents([]);
            }
            document.querySelectorAll('.textAlternativa').forEach(input => input.value = "");
            document.querySelectorAll('input[name="alternativa"]').forEach(radio => radio.checked = false);
            document.getElementById("conteudo").value = "";
            document.getElementById("materia").value = "";
        });
    }
});
import { signup, loginUsuario, verificarSenha, excluirConta, enviarRecuperacao, redefinirSenha, validarSenha } from "./auth.js";
import supabaseClient from "./supabase.js";
import { carregarConteudo } from './buscarConteudo.js';
import { carregarMaterias, carregarConteudos } from "./genereAsk.js";
import { carregarPerguntas, exibirPergunta, verificarResposta } from "./exibePergunta.js";
import { toast } from "./utils.js";
import { initTheme, toggleTheme } from "./theme.js";
import { initDadosConta } from "./conta.js";

let quillEditor = null;
let estaCadastrando = false;

initTheme();
initDadosConta();

function atualizarCorIconeTabela() {
    const isDark = document.body.classList.contains("dark");
    const cor = isDark ? "#aaa" : "#777";
    const icon = document.getElementById("tableIcon");
    if (icon) icon.style.color = cor;
    const delIcon = document.querySelector("#delTableIcon");
    if (delIcon) delIcon.style.color = cor;
}

const toggleThemeOriginal = toggleTheme;
window.toggleTheme = function () {
    toggleThemeOriginal();
    atualizarCorIconeTabela();
};
window.initExcluirConta = initExcluirConta;

function initExcluirConta() {
    const cardsConfi = document.querySelectorAll('.cardConfi');
    const cardExcluir = Array.from(cardsConfi).find(card => card.textContent.includes('Excluir conta'));
    if (!cardExcluir) return;

    const modal = document.getElementById('modalExcluir');
    const modalTexto = document.getElementById('modalTexto');
    const confirmarSenha = document.getElementById('confirmarSenha');
    const btnSim = document.getElementById('btnSim');
    const btnNao = document.getElementById('btnNao');
    const inputSenha = document.getElementById('senhaExcluir');

    let etapaConfirmar = false;

    cardExcluir.addEventListener('click', () => {
        etapaConfirmar = false;
        modal.style.display = 'flex';
        modalTexto.textContent = 'Tem certeza de que deseja excluir sua conta?';
        confirmarSenha.style.display = 'none';
        btnSim.textContent = 'Sim';
    });

    btnNao.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    btnSim.addEventListener('click', async () => {
        if (!etapaConfirmar) {
            etapaConfirmar = true;
            modalTexto.textContent = 'Para confirmar, digite sua senha:';
            confirmarSenha.style.display = 'block';
            btnSim.textContent = 'Excluir';
            inputSenha.value = '';
        } else {
            const senha = inputSenha.value;
            if (!senha) {
                toast('Digite sua senha', 'error');
                return;
            }

            const userLogado = JSON.parse(localStorage.getItem('userLogado'));
            const resultado = await verificarSenha(userLogado.email, senha);

            if (!resultado.success) {
                toast('Senha incorreta', 'error');
                return;
            }

            await excluirConta(userLogado.id_usuario);
            toast('Conta excluída com sucesso!', 'success');
            localStorage.removeItem('userLogado');
            window.location.href = 'inicio.html';
        }
    });
}

initExcluirConta();

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
                    [{ 'size': ['small', false, 'large', 'huge'] }],
                    ["bold", "italic"],
                    [{ 'color': [] }, { 'background': [] }],
                    [{ 'script': 'sub' }, { 'script': 'super' }],
                    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                    ["blockquote"],
                    ["image"]
                ]
            }
        });

        const toolbarEl = quillEditor.getModule("toolbar").container;
        const lastGroup = toolbarEl.querySelector(".ql-formats:last-child");
        const tableBtn = document.createElement("button");
        tableBtn.type = "button";
        tableBtn.className = "ql-table";
        tableBtn.innerHTML = '<i class="fa-solid fa-table" id="tableIcon"></i>';
        tableBtn.title = "Inserir tabela";
        tableBtn.addEventListener("click", () => {
            document.getElementById("modalTabela").style.display = "flex";
        });
        lastGroup.appendChild(tableBtn);

        const delTableBtn = document.createElement("button");
        delTableBtn.type = "button";
        delTableBtn.innerHTML = '<i class="fa-solid fa-trash-can" id="delTableIcon" style="font-size:15px"></i>';
        delTableBtn.title = "Remover tabela";
        delTableBtn.style.display = "none";
        delTableBtn.addEventListener("click", () => {
            const sel = window.getSelection();
            if (!sel.rangeCount) return;
            const node = sel.getRangeAt(0).startContainer;
            const table = node.nodeType === 1 ? node.closest("table") : node.parentElement?.closest("table");
            if (!table) return;

            const tableBlot = Quill.find(table);
            if (!tableBlot) return;

            const index = quillEditor.getIndex(tableBlot);
            const length = tableBlot.length();
            quillEditor.deleteText(index, length + 1);
            delTableBtn.style.display = "none";
        });
        lastGroup.appendChild(delTableBtn);

        quillEditor.on("selection-change", () => {
            const sel = window.getSelection();
            if (!sel.rangeCount) {
                delTableBtn.style.display = "none";
                return;
            }
            const node = sel.getRangeAt(0).startContainer;
            const table = node.nodeType === 1 ? node.closest("table") : node.parentElement?.closest("table");
            delTableBtn.style.display = table && table.closest(".ql-editor") ? "" : "none";
        });

        atualizarCorIconeTabela();
    } /* Cria o Quill.js para criar as opções de formatação de texto da pergunta*/

    const modalTabela = document.getElementById("modalTabela");
    const btnInserirTabela = document.getElementById("btnInserirTabela");
    const btnCancelarTabela = document.getElementById("btnCancelarTabela");

    if (modalTabela && btnInserirTabela && btnCancelarTabela) {
        btnCancelarTabela.addEventListener("click", () => {
            modalTabela.style.display = "none";
        });

        modalTabela.addEventListener("click", (e) => {
            if (e.target === modalTabela) modalTabela.style.display = "none";
        });

        btnInserirTabela.addEventListener("click", () => {
            const rows = parseInt(document.getElementById("tabelaLinhas").value) || 3;
            const cols = parseInt(document.getElementById("tabelaColunas").value) || 3;

            if (rows < 1 || cols < 1) {
                toast("Número mínimo é 1", "error");
                return;
            }
            if (rows > 20 || cols > 20) {
                toast("Máximo é 20 linhas/colunas", "error");
                return;
            }

            let html = '<table class="ql-table"><tbody>';
            for (let r = 0; r < rows; r++) {
                html += '<tr>';
                for (let c = 0; c < cols; c++) {
                    html += '<td></td>';
                }
                html += '</tr>';
            }
            html += '</tbody></table>';

            const range = quillEditor.getSelection(true);
            quillEditor.clipboard.dangerouslyPasteHTML(range.index, html);
            modalTabela.style.display = "none";
        });
    }
    
    const signupForm = document.getElementById("signupForm");
    if (signupForm) {
        signupForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const btn = signupForm.querySelector('button[type="submit"]');
            const originalText = btn.textContent;

            const name = document.getElementById("username").value;
            const email = document.getElementById("email").value;
            const password = document.getElementById("senha").value;
            const confirmPassword = document.getElementById("confirmPassword").value;

            if (password !== confirmPassword) {
                toast("As senhas não conferem", "error");
                return;
            }

            btn.disabled = true;
            btn.textContent = "Cadastrando...";

            try {
                const result = await signup(name, email, password);

                if (result && result.success) {
                    window.location.href = "callback.html?email=" + encodeURIComponent(email);
                } else {
                    btn.disabled = false;
                    btn.textContent = originalText;
                    toast("Erro ao realizar cadastro: " + (result?.error || "Erro desconhecido"), "error");
                }
            } catch (e) {
                btn.disabled = false;
                btn.textContent = originalText;
                toast("Erro ao realizar cadastro", "error");
            }
        });
    }

    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", async (event) => {
            event.preventDefault();

            const btn = loginForm.querySelector('button[type="submit"]');
            const originalText = btn.textContent;

            const loginInput = document.getElementById("loginEmail");
            const passwordInput = document.getElementById("loginPassword");

            if (!loginInput || !passwordInput) return;

            btn.disabled = true;
            btn.textContent = "Entrando...";

            try {
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
                    btn.disabled = false;
                    btn.textContent = originalText;
                    toast("Erro ao realizar login: " + (result?.error || "Erro desconhecido"), "error");
                }
            } catch (e) {
                btn.disabled = false;
                btn.textContent = originalText;
                toast("Erro ao realizar login", "error");
            }
        });
    }

    const recoveryForm = document.getElementById("recoveryForm");
    if (recoveryForm) {
        let enviando = false;
        recoveryForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            if (enviando) return;
            enviando = true;

            const email = document.getElementById("recoveryEmail").value;
            const btn = recoveryForm.querySelector('button[type="submit"]');
            const textoOriginal = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Enviando...';

            const result = await enviarRecuperacao(email);

            if (result.success) {
                toast("Link de recuperação enviado para seu email!", "success");
                recoveryForm.innerHTML = '<p style="text-align:center;color:var(--text-gray);padding:20px 0;">Verifique sua caixa de entrada e clique no link para redefinir sua senha.</p>'
                    + '<p style="text-align:center;font-size:14px;color:var(--text-primary);opacity:0.7;margin-top:12px;">Não recebeu o e-mail? <a href="#" id="linkReenviarRecuperacao" style="color:var(--terceary-color);text-decoration:none;">Reenviar</a></p>';

                const linkReenviar = document.getElementById("linkReenviarRecuperacao");
                if (linkReenviar) {
                    linkReenviar.addEventListener("click", async (e) => {
                        e.preventDefault();
                        linkReenviar.textContent = "Enviando...";
                        linkReenviar.style.pointerEvents = "none";
                        const res = await enviarRecuperacao(email);
                        if (res.success) {
                            toast("Email reenviado com sucesso!", "success");
                        } else {
                            toast(res.error, "error");
                        }
                        linkReenviar.textContent = "Reenviar";
                        linkReenviar.style.pointerEvents = "auto";
                    });
                }
            } else {
                btn.disabled = false;
                btn.innerHTML = textoOriginal;
                enviando = false;
                toast("Erro: " + (result.error || "Erro desconhecido"), "error");
            }
        });
    }

    const resetForm = document.getElementById("resetForm");
    if (resetForm) {
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get("token");


        if (!token) {
            const alerta = document.getElementById("alerta");
            if (alerta) {
                alerta.style.display = "block";
                alerta.style.backgroundColor = "#f8d7da";
                alerta.style.color = "#721c24";
                alerta.style.border = "1px solid #f5c6cb";
                alerta.textContent = "Link inválido ou expirado. Solicite uma nova recuperação de senha.";
                resetForm.style.display = "none";
            }
        }

        resetForm.addEventListener("submit", async (event) => {
            event.preventDefault();
            const novaSenha = document.getElementById("novaSenha").value;
            const confirmarSenha = document.getElementById("confirmarNovaSenha").value;

            if (novaSenha !== confirmarSenha) {
                toast("As senhas não conferem", "error");
                return;
            }

            const errosSenha = validarSenha(novaSenha);
            if (errosSenha.length > 0) {
                toast("A senha deve ter " + errosSenha.join(", "), "error");
                return;
            }

            const result = await redefinirSenha(token, novaSenha);
            if (result.success) {
                toast("Senha redefinida com sucesso!", "success");
                setTimeout(() => {
                    window.location.href = "inicio.html";
                }, 2000);
            } else {
                toast("Erro: " + (result.error || "Erro desconhecido"), "error");
            }
        });
    }

    const formPergunta = document.getElementById("formPergunta");
    const btnPreview = document.getElementById("btnPreview");
    const previewContainer = document.getElementById("previewContainer");
    const btnFecharPreview = document.getElementById("btnFecharPreview");

    if (btnPreview && previewContainer && btnFecharPreview) {
        btnPreview.addEventListener("click", function () {
            const perguntaTexto = quillEditor ? quillEditor.root.innerHTML : document.getElementById("pergunta").value;

            if (!perguntaTexto || perguntaTexto === "<p><br></p>") {
                toast("Digite a pergunta primeiro!", "error");
                return;
            }

            const alternativas = document.querySelectorAll('.textAlternativa');
            const alternativasValores = Array.from(alternativas).map(el => (el.innerHTML ?? '').trim());
            const correta = document.querySelector('input[name="alternativa"]:checked')?.value;

            if (alternativasValores.some(a => a === "" || a === "<br>")) {
                toast("Preencha todas as alternativas!", "error");
                return;
            }

            document.getElementById("perguntaTextoPreview").innerHTML = perguntaTexto;

            const alternativasContainer = document.getElementById("alternativasPreview");
            alternativasContainer.innerHTML = "";

            alternativasValores.forEach((alt, index) => {
                const div = document.createElement("div");
                div.className = "alternativa";
                if ((index + 1).toString() === correta) {
                    div.style.borderColor = "var(--success-color)";
                    div.style.backgroundColor = "rgba(76, 175, 80, 0.1)";
                }
                div.innerHTML = `<strong>${String.fromCharCode(65 + index)}.</strong> ${alt}`;
                alternativasContainer.appendChild(div);
            });

            previewContainer.style.display = "block";
            previewContainer.scrollIntoView({ behavior: "smooth" });
        });

        btnFecharPreview.addEventListener("click", function () {
            previewContainer.style.display = "none";
        });
    }

    if (formPergunta) {
        formPergunta.addEventListener("submit", async function (notReaload) {
            if (estaCadastrando) return;
            notReaload.preventDefault();
            const botao = formPergunta.querySelector('button[type="submit"]');

            const idMateria = document.getElementById("materia").value;
            const idConteudo = document.getElementById("conteudo").value;
            const pergunta = quillEditor ? quillEditor.root.innerHTML : document.getElementById("pergunta").value;

            if (!idConteudo || !pergunta || !idMateria) {
                toast("Selecione o conteúdo e a pergunta!", "error");
                return;
            }
            
            const alternativas = document.querySelectorAll('.textAlternativa');
            const alternativasValores = Array.from(alternativas).map(el => (el.innerHTML ?? '').trim());

            const correta = document.querySelector('input[name="alternativa"]:checked')?.value;
            
            if (!correta) {
                toast("Selecione a alternativa correta!", "error");
                return;
            }

            if (alternativasValores.some(a => a === "" || a === "<br>")) {
                toast("Preencha todas as alternativas!", "error");
                return;
            }

            estaCadastrando = true;
            botao.disabled = true;
            botao.textContent = "Cadastrando...";

            try {
                const userLogado = JSON.parse(localStorage.getItem('userLogado'));
                const visibilidade = document.getElementById("visibilidade")?.value || "publico";
                const { data: perguntaCriada, error: erroPergunta } = await supabaseClient
                    .from("perguntas")
                    .insert([
                        {
                            pergunta_texto: pergunta,
                            id_conteudo: idConteudo,
                            id_materia: idMateria,
                            id_usuario: userLogado.id_usuario,
                            visibilidade: visibilidade
                        }
                    ])
                    .select();

                if (!perguntaCriada || perguntaCriada.length === 0) {
                    toast("Erro ao criar pergunta: " + (erroPergunta?.message || "Erro desconhecido"), "error");
                    return;
                }

                const idPergunta = perguntaCriada[0].id_pergunta || perguntaCriada[0].id;

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
                }

                toast("Pergunta cadastrada com sucesso!", "success");
                if (previewContainer) {
                    previewContainer.style.display = "none";
                }
            } catch (erro) {
                console.error(erro);
                toast("Erro ao cadastrar pergunta", "error");
            } finally {
                estaCadastrando = false;
                botao.disabled = false;
                botao.textContent = "Cadastrar pergunta";
            }
            if (quillEditor) {
                quillEditor.setContents([]);
            }
            document.querySelectorAll('.textAlternativa').forEach(el => el.textContent = "");
            document.querySelectorAll('input[name="alternativa"]').forEach(radio => radio.checked = false);
            $('#materia')[0].selectedIndex = 0;
            $('#materia').trigger('change');
            $('#conteudo').empty().append('<option disabled selected hidden value="">Conteúdo</option>').trigger('change');
        });
    }
});
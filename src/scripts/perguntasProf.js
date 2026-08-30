import supabaseClient from "./supabase.js";
import { carregarMaterias, carregarConteudos } from "./genereAsk.js";
import { toast } from "./utils.js";

const toolbar = document.getElementById("altToolbar");
let hideTimer = null;
let altFocada = null;
let salvandoEdicao = false;

const btnVisibilidade = document.getElementById("btnVisibilidade");
const visibilidadeInput = document.getElementById("visibilidade");

btnVisibilidade.addEventListener("click", () => {
    if (visibilidadeInput.value === "publico") {
        visibilidadeInput.value = "privado";
        btnVisibilidade.textContent = "Privado";
        btnVisibilidade.classList.remove("publico");
        btnVisibilidade.classList.add("privado");
    } else {
        visibilidadeInput.value = "publico";
        btnVisibilidade.textContent = "Público";
        btnVisibilidade.classList.remove("privado");
        btnVisibilidade.classList.add("publico");
    }
});

function autoResize(textarea) {
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
}

function mostrarToolbar(altEl) {
    if (hideTimer) {
        clearTimeout(hideTimer);
        hideTimer = null;
    }

    const box = altEl.closest('.boxInputs');
    if (!box) return;

    if (toolbar.parentNode !== box.parentNode) {
        box.parentNode.insertBefore(toolbar, box);
    } else if (toolbar.nextElementSibling !== box) {
        box.parentNode.insertBefore(toolbar, box);
    }

    toolbar.classList.add("visible");
}

function esconderToolbar() {
    if (hideTimer) clearTimeout(hideTimer);
    hideTimer = setTimeout(() => {
        const active = document.activeElement;
        if (active && (active.closest('.textAlternativa') || active.closest('.alt-format-toolbar'))) return;
        toolbar.classList.remove("visible");
    }, 200);
}

document.querySelectorAll('.textAlternativa').forEach(textarea => {
    autoResize(textarea);
    textarea.addEventListener('input', () => autoResize(textarea));

    textarea.addEventListener('focus', () => {
        altFocada = textarea;
        mostrarToolbar(textarea);
    });

    textarea.addEventListener('blur', esconderToolbar);
});

document.querySelectorAll('.alt-tb-btn').forEach(btn => {
    btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
    });

    btn.addEventListener('click', () => {
        const cmd = btn.dataset.cmd;
        const active = document.activeElement;
        let el = (active && active.closest('.textAlternativa')) || altFocada || document.querySelector('.textAlternativa');

        if (!el) return;

        el.focus();

        if (cmd === 'sqrt') {
            inserirNaAlternativa(el, '√');
        } else if (cmd === 'frac') {
            const sel = window.getSelection();
            const texto = sel.toString().trim();
            if (texto) {
                document.execCommand('insertHTML', false, `<sup>${texto.split('/')[0] || texto}</sup>&frasl;<sub>${texto.split('/')[1] || ''}</sub>`);
            } else {
                document.execCommand('insertText', false, 'a/b');
            }
        } else {
            document.execCommand(cmd, false, null);
        }

        el.dispatchEvent(new Event('input'));
    });

    btn.addEventListener('focus', () => {
        if (altFocada) mostrarToolbar(altFocada);
    });

    btn.addEventListener('blur', esconderToolbar);
});

function inserirNaAlternativa(el, char) {
    const sel = window.getSelection();
    const texto = sel.toString().trim();

    if (texto) {
        document.execCommand('insertHTML', false, char + '(' + texto + ')');
    } else {
        document.execCommand('insertText', false, char);
    }
}

async function initModoEdicao(idPergunta) {
    const userLogado = JSON.parse(localStorage.getItem("userLogado"));
    if (!userLogado) return;

    const quillEditor = window.quillEditor;
    if (!quillEditor) return;

    const { data: pergunta, error } = await supabaseClient
        .from("perguntas")
        .select("*")
        .eq("id_pergunta", idPergunta)
        .single();

    if (error || !pergunta) {
        toast("Erro ao carregar pergunta para edição", "error");
        return;
    }

    const { data: alternativas } = await supabaseClient
        .from("alternativa")
        .select("id_alternativa, correta, nome_alternativa")
        .eq("id_pergunta", idPergunta)
        .order("id_alternativa", { ascending: true });

    window.modoEdicao = true;
    window.idEdicao = idPergunta;
    window.idMateriaEdicao = pergunta.id_materia;
    window.idConteudoEdicao = pergunta.id_conteudo;

    const title = document.querySelector(".title");
    if (title) title.textContent = "Editar pergunta";

    const botao = document.querySelector('#formPergunta button[type="submit"]');
    if (botao) botao.textContent = "Salvar alterações";

    quillEditor.clipboard.dangerouslyPasteHTML(pergunta.pergunta_texto || "");

    const els = document.querySelectorAll('.textAlternativa');
    (alternativas || []).forEach((alt, i) => {
        if (els[i]) els[i].innerHTML = alt.nome_alternativa;
    });

    (alternativas || []).forEach((alt, i) => {
        if (alt.correta) {
            const radio = document.getElementById("alt" + (i + 1));
            if (radio) radio.checked = true;
        }
    });

    const visibilidadeInput = document.getElementById("visibilidade");
    const btnVis = document.getElementById("btnVisibilidade");
    if (pergunta.visibilidade && visibilidadeInput && btnVis) {
        visibilidadeInput.value = pergunta.visibilidade;
        if (pergunta.visibilidade === "privado") {
            btnVis.textContent = "Privado";
            btnVis.classList.remove("publico");
            btnVis.classList.add("privado");
        } else {
            btnVis.textContent = "Público";
            btnVis.classList.remove("privado");
            btnVis.classList.add("publico");
        }
    }

    if (pergunta.id_materia) {
        $('#materia').off('change');
        $('#materia').val(String(pergunta.id_materia)).trigger('change');
        await carregarConteudos();
        $('#conteudo').val(String(pergunta.id_conteudo)).trigger('change');
        $('#materia').on('change', () => carregarConteudos());
    }
}

async function salvarEdicao(pergunta, alternativasValores, correta, visibilidade) {
    const botao = document.querySelector('#formPergunta button[type="submit"]');
    const previewContainer = document.getElementById("previewContainer");

    const { error: erroUpdate } = await supabaseClient
        .from("perguntas")
        .update({
            pergunta_texto: pergunta,
            id_conteudo: window.idConteudoEdicao,
            id_materia: window.idMateriaEdicao,
            visibilidade: visibilidade
        })
        .eq("id_pergunta", window.idEdicao);

    if (erroUpdate) {
        toast("Erro ao atualizar pergunta: " + (erroUpdate.message || "Erro desconhecido"), "error");
        return;
    }

    await supabaseClient
        .from("alternativa")
        .delete()
        .eq("id_pergunta", window.idEdicao);

    for (let i = 0; i < alternativasValores.length; i++) {
        await supabaseClient
            .from("alternativa")
            .insert([{
                nome_alternativa: alternativasValores[i],
                id_pergunta: window.idEdicao,
                correta: (i + 1).toString() === correta
            }]);
    }

    toast("Pergunta atualizada com sucesso!", "success");
    if (previewContainer) previewContainer.style.display = "none";
    setTimeout(() => { window.location.href = "historico_prof.html"; }, 1000);
}

document.addEventListener("DOMContentLoaded", () => {
    const paramsEdicao = new URLSearchParams(window.location.search);
    const idEdicaoParam = paramsEdicao.get("editar");
    if (idEdicaoParam && window.quillEditor) {
        initModoEdicao(idEdicaoParam);
    }

    const formPergunta = document.getElementById("formPergunta");
    if (formPergunta) {
        formPergunta.addEventListener("submit", async (e) => {
            if (!window.modoEdicao || salvandoEdicao) return;
            e.stopImmediatePropagation();
            e.preventDefault();
            salvandoEdicao = true;

            const botao = formPergunta.querySelector('button[type="submit"]');
            botao.disabled = true;
            botao.textContent = "Salvando...";

            try {
                const pergunta = window.quillEditor
                    ? window.quillEditor.root.innerHTML
                    : document.getElementById("pergunta").value;

                const alternativas = document.querySelectorAll('.textAlternativa');
                const alternativasValores = Array.from(alternativas).map(el => (el.innerHTML ?? '').trim());
                const correta = document.querySelector('input[name="alternativa"]:checked')?.value;

                if (!document.getElementById("conteudo").value || !pergunta || !document.getElementById("materia").value) {
                    toast("Selecione o conteúdo e a matéria!", "error");
                    return;
                }
                if (!correta) {
                    toast("Selecione a alternativa correta!", "error");
                    return;
                }
                if (alternativasValores.some(a => a === "" || a === "<br>")) {
                    toast("Preencha todas as alternativas!", "error");
                    return;
                }

                window.idMateriaEdicao = document.getElementById("materia").value;
                window.idConteudoEdicao = document.getElementById("conteudo").value;
                const visibilidade = document.getElementById("visibilidade")?.value || "publico";

                await salvarEdicao(pergunta, alternativasValores, correta, visibilidade);
            } finally {
                salvandoEdicao = false;
                botao.disabled = false;
                botao.textContent = "Salvar alterações";
            }
        }, true);
    }
});
